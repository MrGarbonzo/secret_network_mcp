#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { SecretNetworkClient } from 'secretjs';
import { WalletService } from './wallet-service.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8002', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Secret Network client instance
let secretClient: SecretNetworkClient | null = null;

// Initialize wallet service
let walletService: WalletService | null = null;

// Cache for code hashes to avoid repeated lookups
const codeHashCache = new Map<string, string>();

// Initialize Secret Network client
async function initializeSecretClient(): Promise<void> {
  try {
    const nodeUrl = process.env.SECRET_NODE_URL || 'https://rpc.ankr.com/http/scrt_cosmos';
    const chainId = process.env.SECRET_CHAIN_ID || 'secret-4';
    
    secretClient = new SecretNetworkClient({
      url: nodeUrl,
      chainId: chainId,
    });
    
    console.log('Secret Network client initialized successfully');
    console.log(`Connected to: ${nodeUrl}`);
    console.log(`Chain ID: ${chainId}`);
  } catch (error) {
    console.error('Failed to initialize Secret Network client:', error);
    throw error;
  }
}

// Initialize wallet service
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

// Get code hash for a contract address (with caching)
async function getCodeHash(contractAddress: string): Promise<string> {
  // Check cache first
  if (codeHashCache.has(contractAddress)) {
    const cached = codeHashCache.get(contractAddress)!;
    console.log(`Using cached code hash for ${contractAddress}: ${cached}`);
    return cached;
  }
  
  console.log(`Attempting to resolve code hash for contract: ${contractAddress}`);
  
  // For now, just return empty string and let secretjs handle it
  // The queries are working even without the code hash, just slower
  console.log(`Fallback: Using empty code hash for ${contractAddress} (letting secretjs auto-resolve)`);
  
  // Cache the empty result to avoid repeated attempts
  codeHashCache.set(contractAddress, '');
  return '';
}

// Validation schemas for tool arguments
const BalanceQuerySchema = z.object({
  address: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network address'),
});

const BlockQuerySchema = z.object({
  height: z.number().int().positive().optional(),
});

const AccountQuerySchema = z.object({
  address: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network address'),
});

const TransactionQuerySchema = z.object({
  txHash: z.string().length(64, 'Transaction hash must be 64 characters'),
});

const ContractQuerySchema = z.object({
  contractAddress: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network contract address'),
  query: z.record(z.any()),
});

const SendTokensSchema = z.object({
  from_address: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network address'),
  to_address: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network address'),
  amount: z.string(),
  memo: z.string().optional(),
});

const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()),
});

// Tool definitions
const tools = [
  {
    name: 'secret_query_balance',
    description: 'Query SCRT balance for a Secret Network address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Secret Network address (secret1...)',
          pattern: '^secret1[a-z0-9]+$',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'secret_query_block',
    description: 'Query block information from Secret Network',
    inputSchema: {
      type: 'object',
      properties: {
        height: {
          type: 'number',
          description: 'Block height (optional, defaults to latest)',
          minimum: 1,
        },
      },
      required: [],
    },
  },
  {
    name: 'secret_query_account',
    description: 'Query account information for a Secret Network address',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Secret Network address (secret1...)',
          pattern: '^secret1[a-z0-9]+$',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'secret_query_transaction',
    description: 'Query transaction details by hash',
    inputSchema: {
      type: 'object',
      properties: {
        txHash: {
          type: 'string',
          description: 'Transaction hash (64 character hex string)',
          minLength: 64,
          maxLength: 64,
        },
      },
      required: ['txHash'],
    },
  },
  {
    name: 'secret_query_contract',
    description: 'Query a Secret Network smart contract',
    inputSchema: {
      type: 'object',
      properties: {
        contractAddress: {
          type: 'string',
          description: 'Contract address (secret1...)',
          pattern: '^secret1[a-z0-9]+$',
        },
        query: {
          type: 'object',
          description: 'Query object to send to the contract',
        },
      },
      required: ['contractAddress', 'query'],
    },
  },
  {
    name: 'secret_network_status',
    description: 'Get Secret Network node status and chain information',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'secret_send_tokens',
    description: 'Send SCRT tokens to another address',
    inputSchema: {
      type: 'object',
      properties: {
        from_address: {
          type: 'string',
          description: 'Sender Secret Network address (secret1...)',
          pattern: '^secret1[a-z0-9]+$',
        },
        to_address: {
          type: 'string',
          description: 'Recipient Secret Network address (secret1...)',
          pattern: '^secret1[a-z0-9]+$',
        },
        amount: {
          type: 'string',
          description: 'Amount in SCRT (will be converted to uscrt)',
        },
        memo: {
          type: 'string',
          description: 'Optional transaction memo',
        },
      },
      required: ['from_address', 'to_address', 'amount'],
    },
  },
];

// Tool execution function
async function executeTool(name: string, args: any): Promise<any> {
  if (!secretClient) {
    throw new Error('Secret Network client not initialized');
  }

  switch (name) {
    case 'secret_query_balance': {
      const { address } = BalanceQuerySchema.parse(args);
      
      const balance = await secretClient.query.bank.balance({
        address,
        denom: 'uscrt',
      });
      
      const scrtBalance = balance.balance?.amount 
        ? (parseInt(balance.balance.amount) / 1_000_000).toFixed(6)
        : '0.000000';

      return {
        content: [
          {
            type: 'text',
            text: `SCRT Balance for ${address}: ${scrtBalance} SCRT`,
          },
        ],
      };
    }

    case 'secret_query_block': {
      const { height } = BlockQuerySchema.parse(args || {});
      
      const block = height 
        ? await secretClient.query.tendermint.getBlockByHeight({ height: height.toString() })
        : await secretClient.query.tendermint.getLatestBlock({});

      return {
        content: [
          {
            type: 'text',
            text: `Block ${block.block?.header?.height || 'unknown'}\n` +
                 `Time: ${block.block?.header?.time || 'unknown'}\n` +
                 `Hash: ${block.block_id?.hash || 'unknown'}\n` +
                 `Transactions: ${block.block?.data?.txs?.length || 0}`,
          },
        ],
      };
    }

    case 'secret_query_account': {
      const { address } = AccountQuerySchema.parse(args);
      
      const account = await secretClient.query.auth.account({ address });
      
      return {
        content: [
          {
            type: 'text',
            text: `Account: ${address}\n` +
                 `Account Number: ${(account.account as any)?.account_number || 'unknown'}\n` +
                 `Sequence: ${(account.account as any)?.sequence || 'unknown'}\n` +
                 `Type: ${account.account?.['@type'] || 'unknown'}`,
          },
        ],
      };
    }

    case 'secret_query_transaction': {
      const { txHash } = TransactionQuerySchema.parse(args);
      
      const tx = await secretClient.query.getTx(txHash);
      
      if (!tx) {
        return {
          content: [
            {
              type: 'text',
              text: `Transaction ${txHash} not found`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Transaction: ${txHash}\n` +
                 `Block Height: ${tx.height}\n` +
                 `Gas Used: ${tx.gasUsed}/${tx.gasWanted}\n` +
                 `Result: ${tx.code === 0 ? 'Success' : 'Failed'}\n` +
                 `Events: ${tx.events?.length || 0}`,
          },
        ],
      };
    }

    case 'secret_query_contract': {
      const { contractAddress, query } = ContractQuerySchema.parse(args);
      
      try {
        // Dynamically resolve code hash for the contract
        const codeHash = await getCodeHash(contractAddress);
        
        const result = await secretClient.query.compute.queryContract({
          contract_address: contractAddress,
          code_hash: codeHash, // Use dynamically resolved hash
          query,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Contract Query Result:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Contract query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'secret_network_status': {
      const status = await secretClient.query.tendermint.getNodeInfo({});
      
      return {
        content: [
          {
            type: 'text',
            text: `Secret Network Status\n` +
                 `Chain ID: ${status.default_node_info?.network || 'unknown'}\n` +
                 `Node Version: ${status.default_node_info?.version || 'unknown'}\n` +
                 `App Version: ${status.application_version?.version || 'unknown'}\n` +
                 `Moniker: ${status.default_node_info?.moniker || 'unknown'}`,
          },
        ],
      };
    }

    case 'secret_send_tokens': {
      const { from_address, to_address, amount, memo } = SendTokensSchema.parse(args);
      
      // Convert SCRT to uscrt (1 SCRT = 1,000,000 uscrt)
      const amountUscrt = Math.floor(parseFloat(amount) * 1_000_000).toString();
      
      // Validate addresses
      if (!from_address.startsWith('secret1') || from_address.length !== 45) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid sender address format: ${from_address}`,
            },
          ],
          isError: true,
        };
      }
      
      if (!to_address.startsWith('secret1') || to_address.length !== 45) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid recipient address format: ${to_address}`,
            },
          ],
          isError: true,
        };
      }
      
      // Return transaction details for frontend to sign with Keplr
      // The frontend should use this data to construct and sign the transaction
      return {
        content: [
          {
            type: 'text',
            text: `Transaction prepared:\nFrom: ${from_address}\nTo: ${to_address}\nAmount: ${amount} SCRT (${amountUscrt} uscrt)\nMemo: ${memo || 'none'}`,
          },
        ],
        transactionData: {
          from: from_address,
          to: to_address,
          amount: amountUscrt,
          denom: 'uscrt',
          memo: memo || '',
        },
        requiresKeplrSigning: true,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'secret-network-mcp',
    version: '1.0.0',
    secretClientInitialized: secretClient !== null,
  });
});

// List available tools
app.get('/api/mcp/tools/list', (req, res) => {
  res.json({
    tools: tools,
  });
});

// Execute tool
app.post('/api/mcp/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = ToolCallSchema.parse(req.body);
    
    const result = await executeTool(name, args);
    
    res.json({
      success: true,
      result: result,
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    
    res.status(400).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'execution_error',
      },
    });
  }
});

// Wallet routes
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
        error: error instanceof Error ? error.message : 'Unknown error'
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
        error: error instanceof Error ? error.message : 'Unknown error'
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
        error: error instanceof Error ? error.message : 'Unknown error'
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
        error: error instanceof Error ? error.message : 'Unknown error'
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
        error: error instanceof Error ? error.message : 'Unknown error'
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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('Wallet routes configured');
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      type: 'server_error',
    },
  });
});

// Start the server
async function startServer(): Promise<void> {
  try {
    // Initialize Secret Network client
    await initializeSecretClient();
    await initializeWalletService();
    
    // Setup wallet routes
    setupWalletRoutes(app);
    
    // Start HTTP server - bind to 0.0.0.0 to accept external connections
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Secret Network MCP HTTP Server started successfully`);
      console.log(`Server running on 0.0.0.0:${PORT}`);
      console.log(`External access: http://67.215.13.113:${PORT}`);
      console.log('Available endpoints:');
      console.log(`  GET  /api/health - Health check`);
      console.log(`  GET  /api/mcp/tools/list - List MCP tools`);
      console.log(`  POST /api/mcp/tools/call - Execute MCP tool`);
      console.log(`  POST /api/wallet/connect - Connect wallet from secretgptee`);
      console.log(`  GET  /api/wallet/balance/:address - Get SCRT balance`);
      console.log(`  GET  /api/wallet/transaction/:txHash - Check tx status`);
      console.log(`  GET  /api/wallet/info/:address - Get wallet info`);
      console.log(`  GET  /api/wallet/status - Wallet service status`);
      console.log(`  DELETE /api/wallet/disconnect/:address - Disconnect wallet`);
      console.log(`Ready to accept connections from secretGPT hub`);
    });
  } catch (error) {
    console.error('Failed to start Secret Network MCP HTTP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Unhandled error during startup:', error);
  process.exit(1);
});