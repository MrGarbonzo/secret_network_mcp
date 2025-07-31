# Secret Network MCP - Complete Keplr Integration Plan

**Last Updated:** July 30, 2025
**Status:** Comprehensive implementation plan combining original design with Keplr documentation insights

## 🎯 **Goal:**
Build wallet infrastructure for secretgptee webUI with Keplr integration, connecting through verified message bridge to secret_network_mcp server.

## 📋 **Architecture Overview:**

```
VM1: secretGPT Hub
├── attestAI webUI (existing)
└── secretgptee webUI (NEW - Keplr integration)
         ↓
    [Verified Message Bridge] (Future: Attestation-based)
         ↓
VM2: secret_network_mcp (wallet infrastructure)
```

## 🔧 **Implementation Plan:**

### **Phase 1: secret_network_mcp Wallet Infrastructure**

#### **Update Dependencies (package.json):**
```json
{
  "dependencies": {
    "@cosmjs/amino": "^0.33.1",
    "@cosmjs/crypto": "^0.33.1", 
    "@cosmjs/proto-signing": "^0.33.1",
    "@cosmjs/stargate": "^0.31.3",
    "@cosmjs/tendermint-rpc": "^0.33.1",
    "@modelcontextprotocol/sdk": "^1.13.0",
    "@keplr-wallet/types": "^0.12.29",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "secretjs": "^1.12.0",
    "zod": "^3.22.2"
  }
}
```

#### **Create `src/wallet-service.ts`:**
```typescript
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

    } catch (error) {
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

      const balanceAmount = balance.amount || "0";
      const scrtBalance = (parseInt(balanceAmount) / 1000000).toFixed(6);

      return {
        success: true,
        balance: balanceAmount,
        denom: "uscrt",
        formatted: `${scrtBalance} SCRT`
      };

    } catch (error) {
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
        blockHeight: tx.height
      };

    } catch (error) {
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
```

#### **Update `src/http-server.ts` - Add Wallet Endpoints:**
```typescript
import { WalletService } from './wallet-service.js';

// Initialize wallet service
let walletService: WalletService | null = null;

async function initializeWalletService(): Promise<void> {
  try {
    if (secretClient) {
      walletService = new WalletService(secretClient);
      console.log('Wallet service initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize wallet service:', error);
  }
}

// Add wallet routes
function setupWalletRoutes(app: express.Application): void {
  
  /**
   * POST /api/wallet/connect
   * Receive wallet connection from secretgptee webUI
   */
  app.post('/api/wallet/connect', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const { address, name, isHardwareWallet } = req.body;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: "Address is required"
        });
      }

      const result = await walletService.connectWallet(address, name, isHardwareWallet);
      res.json(result);

    } catch (error) {
      console.error('Wallet connect error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/wallet/balance/:address
   */
  app.get('/api/wallet/balance/:address', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const { address } = req.params;
      const result = await walletService.getWalletBalance(address);
      res.json(result);

    } catch (error) {
      console.error('Balance query error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/wallet/transaction/:txHash
   * Check transaction status after Keplr broadcasting
   */
  app.get('/api/wallet/transaction/:txHash', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const { txHash } = req.params;
      const result = await walletService.getTransactionStatus(txHash);
      res.json(result);

    } catch (error) {
      console.error('Transaction status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/wallet/info/:address
   */
  app.get('/api/wallet/info/:address', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const { address } = req.params;
      const walletInfo = walletService.getWalletInfo(address);
      
      if (walletInfo) {
        res.json({
          success: true,
          wallet: walletInfo
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Wallet not connected"
        });
      }

    } catch (error) {
      console.error('Wallet info error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/wallet/disconnect/:address
   */
  app.delete('/api/wallet/disconnect/:address', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const { address } = req.params;
      const result = walletService.disconnectWallet(address);
      
      res.json({
        success: result,
        message: result ? "Wallet disconnected" : "Wallet not found"
      });

    } catch (error) {
      console.error('Wallet disconnect error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/wallet/status
   */
  app.get('/api/wallet/status', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const status = walletService.getStatus();
      res.json(status);

    } catch (error) {
      console.error('Wallet status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  console.log('Wallet routes configured');
}

// Update server initialization
async function startServer(): Promise<void> {
  try {
    await initializeSecretClient();
    await initializeWalletService();
    
    // Setup existing MCP routes
    // ... existing code ...
    
    // Setup new wallet routes
    setupWalletRoutes(app);
    
    const port = process.env.PORT || 8002;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Secret Network MCP Server running on port ${port}`);
      console.log('Available endpoints:');
      console.log('  GET  /api/health - Health check');
      console.log('  GET  /api/mcp/tools/list - List MCP tools');
      console.log('  POST /api/mcp/tools/call - Execute MCP tool');
      console.log('  POST /api/wallet/connect - Connect wallet from secretgptee');
      console.log('  GET  /api/wallet/balance/:address - Get SCRT balance');
      console.log('  GET  /api/wallet/transaction/:txHash - Check tx status');
      console.log('  GET  /api/wallet/info/:address - Get wallet info');
      console.log('  GET  /api/wallet/status - Wallet service status');
      console.log('  DELETE /api/wallet/disconnect/:address - Disconnect wallet');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

### **Phase 2: secretgptee WebUI (VM1)**

#### **Keplr Integration Frontend:**
```javascript
// secretgptee webUI - Keplr connection flow
class SecretGPTeeWallet {
  constructor() {
    this.chainId = "secret-4";
    this.connectedAddress = null;
  }

  /**
   * Connect to Keplr wallet
   */
  async connectWallet() {
    try {
      // Check if Keplr is available
      if (!window.keplr) {
        throw new Error("Please install Keplr extension");
      }

      // Enable connection to Secret Network
      await window.keplr.enable(this.chainId);

      // Get wallet details
      const key = await window.keplr.getKey(this.chainId);

      // Send wallet info to secretGPT Hub
      const response = await fetch('/api/secretgptee/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: key.bech32Address,
          name: key.name,
          isHardwareWallet: key.isNanoLedger || key.isKeystone
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.connectedAddress = key.bech32Address;
        this.updateUI(key);
        return key;
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Send SCRT transaction (basic transfer)
   */
  async sendTransaction(toAddress, amount) {
    try {
      if (!this.connectedAddress) {
        throw new Error("Wallet not connected");
      }

      // Build transaction using Keplr's signing
      const offlineSigner = window.keplr.getOfflineSigner(this.chainId);
      const accounts = await offlineSigner.getAccounts();
      const enigmaUtils = window.keplr.getEnigmaUtils(this.chainId);

      // Initialize SecretJS with Keplr
      const secretjs = new SecretNetworkClient({
        url: "https://api.secret.network",
        chainId: this.chainId,
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
        encryptionUtils: enigmaUtils,
      });

      // Build and sign transaction
      const tx = await secretjs.tx.bank.send(
        {
          from_address: this.connectedAddress,
          to_address: toAddress,
          amount: [{ denom: "uscrt", amount: String(amount * 1000000) }]
        },
        {
          gasLimit: 200000,
        }
      );

      // Keplr handles broadcasting
      console.log("Transaction hash:", tx.transactionHash);
      
      // Check transaction status via secret_network_mcp
      await this.checkTransactionStatus(tx.transactionHash);
      
      return tx.transactionHash;

    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(txHash) {
    try {
      const response = await fetch(`/api/secretgptee/transaction/${txHash}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      throw error;
    }
  }

  /**
   * Update UI with wallet info
   */
  updateUI(key) {
    // Update secretgptee webUI with wallet details
    document.getElementById('wallet-address').textContent = key.bech32Address;
    document.getElementById('wallet-name').textContent = key.name;
    document.getElementById('hardware-wallet').textContent = 
      key.isNanoLedger || key.isKeystone ? 'Hardware' : 'Software';
  }
}
```

### **Phase 3: secretGPT Hub Integration (VM1)**

#### **New Endpoints for secretgptee:**
```typescript
// secretGPT Hub - Proxy endpoints for secretgptee
app.post('/api/secretgptee/wallet/connect', async (req, res) => {
  try {
    // Forward to secret_network_mcp via verified bridge
    const response = await fetch('http://secret-network-mcp:8002/api/wallet/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/secretgptee/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const response = await fetch(`http://secret-network-mcp:8002/api/wallet/transaction/${txHash}`);
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 🎯 **Key Implementation Benefits:**

### **Simplified Architecture:**
- 🚀 **Keplr handles broadcasting** - No complex transaction broadcasting in secret_network_mcp
- 🔐 **Browser-only signing** - Private keys never leave Keplr
- 🛡️ **Clean separation** - UI handles wallet, server handles queries
- 📡 **Status monitoring** - Track transactions after Keplr broadcasts

### **Hardware Wallet Support:**
- 🔧 **Automatic detection** - Identify Ledger/Keystone wallets
- ⚙️ **Appropriate signing modes** - Handle hardware wallet limitations
- 🔒 **Enhanced security** - Hardware wallet compatibility

### **Future Ready:**
- 🔗 **Verified bridge preparation** - API structured for attestation
- 📈 **Expandable features** - Framework for staking, governance, trading
- 🎮 **Multiple webUI support** - attestAI + secretgptee parallel operation

## 📝 **Implementation Sequence:**

1. ✅ **secret_network_mcp wallet infrastructure** - Phase 1
2. ✅ **secretgptee webUI Keplr integration** - Phase 2  
3. ✅ **secretGPT Hub proxy endpoints** - Phase 3
4. 🔄 **Testing & validation** - End-to-end flow
5. 🚀 **Production deployment** - Docker + verified bridge

## 🔧 **Environment Configuration:**

#### **Create `.env.example`:**
```bash
# Secret Network Configuration
SECRET_NODE_URL=https://rpc.ankr.com/http/scrt_cosmos
SECRET_CHAIN_ID=secret-4

# HTTP Server Configuration  
PORT=8002
HOST=0.0.0.0

# Wallet Service Configuration
WALLET_SERVICE_ENABLED=true
WALLET_TIMEOUT=10000
WALLET_MAX_CONNECTIONS=100

# Logging
LOG_LEVEL=info
```

## 🧪 **Testing the Integration:**

#### **Test Wallet Endpoints:**
```bash
# Build and start server
npm run build && npm start

# Test wallet status
curl http://localhost:8002/api/wallet/status

# Test wallet connection
curl -X POST http://localhost:8002/api/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{"address": "secret1test...", "name": "Test Wallet"}'

# Test balance query
curl http://localhost:8002/api/wallet/balance/secret1test...

# Test transaction status
curl http://localhost:8002/api/wallet/transaction/ABC123...

# Test health check (existing)
curl http://localhost:8002/api/health
```

## 📚 **Keplr Integration Reference:**

### **Key Keplr API Methods:**
```javascript
// Enable connection
await window.keplr.enable("secret-4");

// Get wallet details
const key = await window.keplr.getKey("secret-4");
// Returns: { name, bech32Address, isNanoLedger, isKeystone, ... }

// Transaction broadcasting (handled by Keplr)
const txResponse = await keplr.sendTx("secret-4", protobufTx, "block");
```

### **Hardware Wallet Detection:**
- **Ledger**: `key.isNanoLedger === true`
- **Keystone**: `key.isKeystone === true`
- **Software**: Both flags are `false`

**This comprehensive plan merges the original design with Keplr documentation insights, creating a complete implementation roadmap that leverages Keplr's broadcasting capabilities while maintaining the secure VM separation architecture.**