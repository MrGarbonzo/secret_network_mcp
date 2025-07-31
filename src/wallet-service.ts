import { SecretNetworkClient } from 'secretjs';

export interface WalletConnection {
  success: boolean;
  address?: string;
  name?: string;
  isHardwareWallet?: boolean;
  error?: string;
}

export interface BalanceResult {
  success: boolean;
  balance?: string;
  denom?: string;
  formatted?: string;
  error?: string;
}

export interface TransactionStatus {
  success: boolean;
  txHash?: string;
  status?: 'pending' | 'success' | 'failed';
  blockHeight?: number;
  error?: string;
}

export class WalletService {
  private secretClient: SecretNetworkClient;
  private chainId: string = "secret-4";
  private connectedWallets: Map<string, any> = new Map();

  constructor(secretClient: SecretNetworkClient) {
    this.secretClient = secretClient;
  }

  /**
   * Connect wallet - Store wallet info from secretgptee webUI
   */
  async connectWallet(
    address: string, 
    name?: string, 
    isHardwareWallet?: boolean
  ): Promise<WalletConnection> {
    try {
      // Validate Secret Network address format
      if (!address.startsWith('secret1') || address.length !== 45) {
        return {
          success: false,
          error: "Invalid Secret Network address format"
        };
      }

      // Verify address exists on chain
      try {
        await this.secretClient.query.auth.account({ address });
      } catch (error) {
        return {
          success: false,
          error: "Address not found on Secret Network"
        };
      }

      // Store connection info
      this.connectedWallets.set(address, {
        address,
        name: name || "Keplr Wallet",
        isHardwareWallet: isHardwareWallet || false,
        connectedAt: new Date().toISOString()
      });

      return {
        success: true,
        address,
        name: name || "Keplr Wallet",
        isHardwareWallet
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string): Promise<BalanceResult> {
    try {
      const balance = await this.secretClient.query.bank.balance({
        address,
        denom: "uscrt"
      });

      const balanceAmount = balance.balance?.amount || "0";
      const scrtBalance = (parseInt(balanceAmount) / 1000000).toFixed(6);

      return {
        success: true,
        balance: balanceAmount,
        denom: "uscrt",
        formatted: `${scrtBalance} SCRT`
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get balance: ${error.message}`
      };
    }
  }

  /**
   * Monitor transaction status by hash
   * (Since Keplr handles broadcasting, we just check status)
   */
  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      const tx = await this.secretClient.query.getTx(txHash);
      
      if (!tx) {
        return {
          success: false,
          error: "Transaction not found"
        };
      }

      return {
        success: true,
        txHash,
        status: tx.code === 0 ? 'success' : 'failed',
        blockHeight: parseInt(tx.height.toString())
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get transaction status: ${error.message}`
      };
    }
  }

  /**
   * Get connected wallet info
   */
  getWalletInfo(address: string) {
    return this.connectedWallets.get(address) || null;
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(address: string): boolean {
    return this.connectedWallets.delete(address);
  }

  /**
   * Get wallet service status
   */
  getStatus() {
    return {
      success: true,
      chainId: this.chainId,
      connectedWallets: this.connectedWallets.size,
      serviceStatus: "operational",
      lastUpdate: new Date().toISOString()
    };
  }
}