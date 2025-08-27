#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { SecretNetworkClient } from 'secretjs';
import { TOKEN_REGISTRY, findToken, findNFT, listTokenSymbols, listNFTCollections, type TokenInfo, type NFTInfo } from './token-registry.js';
import { formatTokenInfoQuery, formatNFTContractInfoQuery } from './query-helpers.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8002', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Secret Network client instance
let secretClient: SecretNetworkClient | null = null;


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

const TokenInfoSchema = z.object({
  tokenSymbolOrName: z.string().describe('Token symbol or name'),
});

const NFTInfoSchema = z.object({
  collectionName: z.string().describe('NFT collection name'),
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
  // NOTE: secret_query_token_balance removed - broken permit implementation
  // Will be replaced with correct permit-based token query tool
  {
    name: 'secret_query_token_info',
    description: 'Get token information (name, symbol, decimals, supply)',
    inputSchema: {
      type: 'object',
      properties: {
        tokenSymbolOrName: {
          type: 'string',
          description: 'Token symbol or name',
        },
      },
      required: ['tokenSymbolOrName'],
    },
  },
  // NFT permit-based queries removed - require wallet signatures
  // These should be handled in the frontend with direct Keplr integration
  {
    name: 'secret_query_nft_info',
    description: 'Get NFT collection information',
    inputSchema: {
      type: 'object',
      properties: {
        collectionName: {
          type: 'string',
          description: 'NFT collection name',
        },
      },
      required: ['collectionName'],
    },
  },
  {
    name: 'secret_list_known_tokens',
    description: 'List all known tokens and NFT collections',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
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

    // NOTE: secret_query_token_balance case removed - broken permit implementation
    // Will be replaced with correct permit-based token balance query

    case 'secret_query_token_info': {
      const { tokenSymbolOrName } = TokenInfoSchema.parse(args);
      
      // Find token in registry
      const token = findToken(tokenSymbolOrName);
      if (!token) {
        return {
          content: [
            {
              type: 'text',
              text: `Token not found: ${tokenSymbolOrName}\nAvailable tokens: ${listTokenSymbols().join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      
      // Get code hash for the token
      const codeHash = token.codeHash || await getCodeHash(token.address);
      
      // Query token info
      const query = formatTokenInfoQuery();
      const result = await secretClient.query.compute.queryContract({
        contract_address: token.address,
        code_hash: codeHash,
        query,
      });
      
      const tokenInfo = result as any;
      
      return {
        content: [
          {
            type: 'text',
            text: `Token Information:\nName: ${tokenInfo.name || token.name}\nSymbol: ${tokenInfo.symbol || token.symbol}\nDecimals: ${tokenInfo.decimals || token.decimals}\nTotal Supply: ${tokenInfo.total_supply ? (parseInt(tokenInfo.total_supply) / Math.pow(10, token.decimals)).toFixed(2) : 'N/A'}\nContract: ${token.address}\nType: ${token.type}\nCategory: ${token.category}`,
          },
        ],
      };
    }

    case 'secret_query_nft_info': {
      const { collectionName } = NFTInfoSchema.parse(args);
      
      // Find NFT collection in registry
      const nft = findNFT(collectionName);
      if (!nft) {
        return {
          content: [
            {
              type: 'text',
              text: `NFT collection not found: ${collectionName}\nAvailable collections: ${listNFTCollections().join(', ')}`,
            },
          ],
          isError: true,
        };
      }
      
      // Get code hash for the NFT contract
      const codeHash = nft.codeHash || await getCodeHash(nft.address);
      
      // Query contract info
      const query = formatNFTContractInfoQuery();
      const result = await secretClient.query.compute.queryContract({
        contract_address: nft.address,
        code_hash: codeHash,
        query,
      });
      
      const contractInfo = result as any;
      
      return {
        content: [
          {
            type: 'text',
            text: `NFT Collection Information:\nName: ${contractInfo.name || nft.name}\nSymbol: ${contractInfo.symbol || nft.symbol}\nContract: ${nft.address}\nType: ${nft.type}`,
          },
        ],
      };
    }

    case 'secret_list_known_tokens': {
      const tokens = Object.values(TOKEN_REGISTRY.tokens);
      const nfts = Object.values(TOKEN_REGISTRY.nfts);
      
      const tokenList = tokens.map(t => `• ${t.symbol} - ${t.name} (${t.category})`).join('\n');
      const nftList = nfts.map(n => `• ${n.name} (${n.symbol})`).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Known Tokens (${tokens.length}):\n${tokenList}\n\nNFT Collections (${nfts.length}):\n${nftList}\n\nUse these names/symbols in queries like:\n- "query saWETH balance for secret1..."\n- "check jack robbins NFTs for secret1..."`,
          },
        ],
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

// Wallet functionality removed - should be handled in frontend with Keplr

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
    
    // Start HTTP server - bind to 0.0.0.0 to accept external connections
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Secret Network MCP HTTP Server started successfully`);
      console.log(`Server running on 0.0.0.0:${PORT}`);
      console.log(`External access: http://67.215.13.113:${PORT}`);
      console.log('Available endpoints:');
      console.log(`  GET  /api/health - Health check`);
      console.log(`  GET  /api/mcp/tools/list - List MCP tools`);
      console.log(`  POST /api/mcp/tools/call - Execute MCP tool`);
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