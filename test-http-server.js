#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock tools for testing
const tools = [
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
  }
];

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'secret-network-mcp',
    version: '1.0.0',
    mode: 'test'
  });
});

// List available tools
app.get('/api/mcp/tools/list', (req, res) => {
  res.json({
    tools: tools,
  });
});

// Execute tool (mock implementation for testing)
app.post('/api/mcp/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (name === 'secret_network_status') {
      res.json({
        success: true,
        result: {
          content: [
            {
              type: 'text',
              text: 'Secret Network Status\\nChain ID: secret-4\\nNode Version: v1.12.0\\nApp Version: v1.12.0\\nMoniker: test-node (TEST MODE)',
            },
          ],
        }
      });
    } else if (name === 'secret_query_balance') {
      const address = args?.address || 'secret1test';
      res.json({
        success: true,
        result: {
          content: [
            {
              type: 'text',
              text: `SCRT Balance for ${address}: 1000.000000 SCRT (TEST MODE)`,
            },
          ],
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: `Unknown tool: ${name}`,
          type: 'tool_not_found',
        },
      });
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Unknown error',
        type: 'execution_error',
      },
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
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
console.log('🚀 Starting Secret Network MCP HTTP Server (TEST MODE)...');
app.listen(PORT, () => {
  console.log(`✅ Secret Network MCP HTTP Server started successfully`);
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tools list: http://localhost:${PORT}/api/mcp/tools/list`);
  console.log(`🔧 Tool execution: POST http://localhost:${PORT}/api/mcp/tools/call`);
  console.log('📝 Note: Running in TEST MODE with mock Secret Network data');
});