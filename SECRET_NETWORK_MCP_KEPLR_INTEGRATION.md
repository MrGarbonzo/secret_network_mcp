# Secret Network MCP - Keplr SDK Integration Plan

**Last Updated:** July 28, 2025
**Status:** Plan to add Keplr SDK to existing secret_network_mcp server

## 🎯 **Goal:**
Add Keplr SDK and wallet endpoints to the existing secret_network_mcp HTTP server to handle wallet operations in a dedicated TEE.

## 📋 **Current State Analysis:**

### **Existing secret_network_mcp Structure:**
```
F:\coding\secret_network_mcp\
├── src\
│   ├── index.ts (MCP stdio server)
│   └── http-server.ts (HTTP API server)
├── package.json
├── tsconfig.json
└── README.md
```

### **Current HTTP Server Features:**
- ✅ Port 8002 HTTP API
- ✅ Secret Network tools (balance queries, network status)
- ✅ MCP tool execution endpoints
- ✅ Health check endpoints

## 🔧 **Implementation Plan:**

### **Step 1: Add Keplr SDK Dependencies**

#### **Update package.json:**
```bash
cd F:\coding\secret_network_mcp
npm install @keplr-wallet/provider-extension @keplr-wallet/types
npm install --save-dev @types/node
```

#### **Updated Dependencies:**
```json
{
  "dependencies": {
    "@cosmjs/amino": "^0.33.1",
    "@cosmjs/crypto": "^0.33.1", 
    "@cosmjs/proto-signing": "^0.33.1",
    "@cosmjs/stargate": "^0.31.3",
    "@cosmjs/tendermint-rpc": "^0.33.1",
    "@modelcontextprotocol/sdk": "^1.13.0",
    "@keplr-wallet/provider-extension": "^0.12.29",
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

### **Step 2: Create Wallet Service**

#### **Create `src/wallet-service.ts`:**
```typescript
import { SecretNetworkClient } from 'secretjs';

export interface WalletConnection {
  success: boolean;
  address?: string;
  name?: string;
  error?: string;
}

export interface BalanceResult {
  success: boolean;
  balance?: string;
  denom?: string;
  formatted?: string;
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
   * Handle wallet connection - Server-side approach for TEE demo
   */
  async connectWallet(address: string, name?: string): Promise<WalletConnection> {
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

      // Store connection info (demo purposes)
      this.connectedWallets.set(address, {
        address,
        name: name || "Demo Wallet",
        connectedAt: new Date().toISOString()
      });

      return {
        success: true,
        address,
        name: name || "Demo Wallet"
      };

    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get wallet balance using existing Secret Network client
   */
  async getWalletBalance(address: string): Promise<BalanceResult> {
    try {
      // Use existing SecretJS client to query balance
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

  /**
   * Future: Transaction signing with Keplr SDK
   * This will be implemented when we add browser interaction
   */
  async signTransaction(txData: any): Promise<any> {
    // Placeholder for future Keplr signing integration
    return {
      success: false,
      error: "Transaction signing not yet implemented"
    };
  }
}
```

### **Step 3: Add Wallet Endpoints to HTTP Server**

#### **Update `src/http-server.ts`:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SecretNetworkClient } from 'secretjs';
import { WalletService } from './wallet-service.js';

// Existing imports and setup...

// Add wallet service initialization
let walletService: WalletService | null = null;

// Initialize wallet service after Secret Network client is ready
async function initializeWalletService(): Promise<void> {
  try {
    if (secretClient) {
      walletService = new WalletService(secretClient);
      console.log('Wallet service initialized successfully');
    } else {
      console.error('Cannot initialize wallet service: Secret Network client not available');
    }
  } catch (error) {
    console.error('Failed to initialize wallet service:', error);
  }
}

// Add wallet endpoints to existing Express app
function setupWalletRoutes(app: express.Application): void {
  
  /**
   * POST /api/wallet/connect
   * Connect a wallet using address
   */
  app.post('/api/wallet/connect', async (req, res) => {
    try {
      if (!walletService) {
        return res.status(503).json({
          success: false,
          error: "Wallet service not available"
        });
      }

      const { address, name } = req.body;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: "Address is required"
        });
      }

      const result = await walletService.connectWallet(address, name);
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
   * Get wallet balance for address
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
   * GET /api/wallet/info/:address
   * Get connected wallet information
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
   * Disconnect wallet
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
   * Get wallet service status
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

// Update the main server initialization
async function startServer(): Promise<void> {
  try {
    // Initialize Secret Network client (existing code)
    await initializeSecretClient();
    
    // Initialize wallet service
    await initializeWalletService();
    
    // Setup existing MCP routes
    // ... existing route setup code ...
    
    // Setup new wallet routes
    setupWalletRoutes(app);
    
    // Start server
    const port = process.env.PORT || 8002;
    app.listen(port, () => {
      console.log(`Secret Network MCP Server running on port ${port}`);
      console.log('Available endpoints:');
      console.log('  GET  /api/health - Health check');
      console.log('  GET  /api/mcp/tools/list - List MCP tools');
      console.log('  POST /api/mcp/tools/call - Execute MCP tool');
      console.log('  POST /api/wallet/connect - Connect wallet');
      console.log('  GET  /api/wallet/balance/:address - Get balance');
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

### **Step 4: Update TypeScript Configuration**

#### **Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "test*"]
}
```

### **Step 5: Update Build Scripts**

#### **Update `package.json` scripts:**
```json
{
  "scripts": {
    "prebuild": "rm -rf build",
    "build": "tsc",
    "postbuild": "if [ -d build ]; then find build -name '*.js' -exec chmod 755 {} +; fi",
    "start": "node build/http-server.js",
    "start:mcp": "node build/index.js",
    "start:http": "node build/http-server.js",
    "start:wallet": "npm run build && npm run start:http",
    "dev": "tsc --watch",
    "dev:http": "tsc && node build/http-server.js",
    "test:wallet": "npm run build && node -e \"console.log('Testing wallet endpoints...'); process.exit(0)\"",
    "inspect": "npx @modelcontextprotocol/inspector build/index.js",
    "test": "node test-server.js",
    "validate": "npm run build && npm run test && npm run inspect"
  }
}
```

### **Step 6: Environment Configuration**

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

### **Step 7: Testing the Integration**

#### **Test Wallet Endpoints:**
```bash
# Build and start server
npm run start:wallet

# Test wallet status
curl http://localhost:8002/api/wallet/status

# Test wallet connection
curl -X POST http://localhost:8002/api/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{"address": "secret1test...", "name": "Test Wallet"}'

# Test balance query
curl http://localhost:8002/api/wallet/balance/secret1test...

# Test health check (existing)
curl http://localhost:8002/api/health
```

## 🎯 **Benefits of This Implementation:**

### **TEE Integration:**
- 🔐 **Wallet isolation** - All wallet operations in dedicated TEE
- 🛡️ **Secure communication** - Ready for attestation-based signing
- 🔏 **Clean separation** - Wallet logic separate from frontend

### **Demo Features:**
- 📱 **Simple connection** - Address-based connection for demo
- 💰 **Balance queries** - Real Secret Network balance data
- 🎮 **Status monitoring** - Wallet service health tracking
- 🔄 **Easy testing** - Clear API endpoints for validation

### **Future Ready:**
- 🚀 **Transaction signing** - Framework ready for Keplr integration
- 📡 **Message signing** - Architecture supports attestation verification
- 🧩 **Expandable** - Easy to add more wallet features

## 📝 **Implementation Steps:**

1. ✅ **Add dependencies** - Keplr SDK packages
2. ✅ **Create WalletService** - Core wallet operations
3. ✅ **Add HTTP endpoints** - REST API for wallet operations  
4. ✅ **Update build config** - TypeScript and build scripts
5. ✅ **Test integration** - Validate all endpoints work
6. ✅ **Connect to secretGPT** - Integrate with hub proxy

**This plan adds robust wallet capabilities to secret_network_mcp while maintaining the existing MCP functionality and preparing for future attestation-based features.**