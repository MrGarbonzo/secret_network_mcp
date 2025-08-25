#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { SecretNetworkClient } from 'secretjs';
import { TOKEN_REGISTRY, findToken, findNFT, listTokenSymbols, listNFTCollections, type TokenInfo, type NFTInfo } from './token-registry';
import { formatTokenInfoQuery, formatNFTContractInfoQuery } from './query-helpers';

// Server configuration
const server = new Server(
  {
    name: 'secret-network-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

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
    
    console.error('Secret Network client initialized successfully');
    console.error(`Connected to: ${nodeUrl}`);
    console.error(`Chain ID: ${chainId}`);
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
    console.error(`Using cached code hash for ${contractAddress}: ${cached}`);
    return cached;
  }
  
  try {
    if (!secretClient) {
      console.error('Secret client not initialized');
      return '';
    }

    // Get contract info
    const contractInfo = await secretClient.query.compute.contractInfo({
      contract_address: contractAddress
    });
    
    // Extract code ID from the nested structure
    const codeId = (contractInfo as any).contract_info?.code_id || 
                   (contractInfo as any).ContractInfo?.code_id ||
                   (contractInfo as any).code_id;
    
    if (!codeId) {
      console.error('Could not find code ID in contract info');
      return '';
    }
    
    // Convert code ID to number if it's a string
    const codeIdNum = typeof codeId === 'string' ? parseInt(codeId, 10) : codeId;
    
    // Get code info using code ID
    const codeInfo = await secretClient.query.compute.code(codeIdNum);
    const codeHash = (codeInfo as any).code_hash || 
                     (codeInfo as any).codeHash || 
                     (codeInfo as any).CodeInfo?.code_hash ||
                     (codeInfo as any).CodeInfo?.CodeHash;
    
    // Cache the result
    codeHashCache.set(contractAddress, codeHash);
    console.error(`Resolved code hash for ${contractAddress}: ${codeHash}`);
    
    return codeHash;
  } catch (error) {
    console.error(`Failed to get code hash for ${contractAddress}:`, error);
    // Return empty string as fallback - secretjs might be able to resolve it
    return '';
  }
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

const TokenBalanceSchema = z.object({
  tokenSymbolOrName: z.string().describe('Token symbol (e.g., saWETH) or name (e.g., wrapped eth)'),
  address: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network address'),
  viewingKey: z.string().optional(),
});

const TokenInfoSchema = z.object({
  tokenSymbolOrName: z.string().describe('Token symbol or name'),
});

const NFTOwnershipSchema = z.object({
  collectionName: z.string().describe('NFT collection name (e.g., jack robbins)'),
  ownerAddress: z.string().regex(/^secret1[a-z0-9]+$/, 'Invalid Secret Network address'),
  viewingKey: z.string().optional(),
  limit: z.number().int().positive().max(100).default(30).optional(),
});

const NFTInfoSchema = z.object({
  collectionName: z.string().describe('NFT collection name'),
});

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
        name: 'secret_query_token_balance',
        description: 'Query SNIP-20/25 token balance (e.g., saWETH, saUSDC, sSCRT)',
        inputSchema: {
          type: 'object',
          properties: {
            tokenSymbolOrName: {
              type: 'string',
              description: 'Token symbol (e.g., saWETH) or name (e.g., wrapped eth)',
            },
            address: {
              type: 'string',
              description: 'Wallet address to check balance for',
              pattern: '^secret1[a-z0-9]+$',
            },
            viewingKey: {
              type: 'string',
              description: 'Optional viewing key for private balance',
            },
          },
          required: ['tokenSymbolOrName', 'address'],
        },
      },
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
      {
        name: 'secret_query_nft_ownership',
        description: 'Check NFT ownership for a wallet address',
        inputSchema: {
          type: 'object',
          properties: {
            collectionName: {
              type: 'string',
              description: 'NFT collection name (e.g., jack robbins)',
            },
            ownerAddress: {
              type: 'string',
              description: 'Wallet address to check NFT ownership',
              pattern: '^secret1[a-z0-9]+$',
            },
            viewingKey: {
              type: 'string',
              description: 'Optional viewing key for private NFTs',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of NFTs to return (default: 30, max: 100)',
            },
          },
          required: ['collectionName', 'ownerAddress'],
        },
      },
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
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!secretClient) {
      throw new McpError(
        ErrorCode.InternalError,
        'Secret Network client not initialized'
      );
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

      case 'secret_query_token_balance': {
        const { tokenSymbolOrName, address, viewingKey } = TokenBalanceSchema.parse(args);
        
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
          };
        }
        
        try {
          // Get code hash for the token
          const codeHash = token.codeHash || await getCodeHash(token.address);
          
          // NOTE: Viewing key-based queries are deprecated and broken
          // Use the HTTP server with permit-based queries instead
          throw new Error('Token balance queries with viewing keys are no longer supported. Use permit-based queries via HTTP server.');
        } catch (error) {
          throw error;
        }
      }

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

      case 'secret_query_nft_ownership': {
        const { collectionName, ownerAddress, viewingKey, limit } = NFTOwnershipSchema.parse(args);
        
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
          };
        }
        
        // Get code hash for the NFT contract
        const codeHash = nft.codeHash || await getCodeHash(nft.address);
        
        // NOTE: Viewing key-based queries are deprecated and broken
        // Use the HTTP server with permit-based queries instead
        throw new Error('NFT ownership queries with viewing keys are no longer supported. Use permit-based queries via HTTP server.');
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
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Main function to start the server
async function main(): Promise<void> {
  try {
    // Initialize Secret Network client
    await initializeSecretClient();
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('Secret Network MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start Secret Network MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});