const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 8002;

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

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle OPTIONS for CORS
  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Health check endpoint
  if (path === '/api/health' && method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'secret-network-mcp',
      version: '1.0.0',
      mode: 'test'
    }));
    return;
  }

  // List tools endpoint
  if (path === '/api/mcp/tools/list' && method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      tools: tools
    }));
    return;
  }

  // Execute tool endpoint
  if (path === '/api/mcp/tools/call' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { name, arguments: args } = JSON.parse(body);
        
        if (name === 'secret_network_status') {
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Secret Network Status\\nChain ID: secret-4\\nNode Version: v1.12.0\\nApp Version: v1.12.0\\nMoniker: test-node (TEST MODE)',
                },
              ],
            }
          }));
        } else if (name === 'secret_query_balance') {
          const address = args?.address || 'secret1test';
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            result: {
              content: [
                {
                  type: 'text',
                  text: `SCRT Balance for ${address}: 1000.000000 SCRT (TEST MODE)`,
                },
              ],
            }
          }));
        } else {
          res.statusCode = 400;
          res.end(JSON.stringify({
            success: false,
            error: {
              message: `Unknown tool: ${name}`,
              type: 'tool_not_found',
            },
          }));
        }
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          error: {
            message: error.message || 'Invalid JSON',
            type: 'parse_error',
          },
        }));
      }
    });
    return;
  }

  // 404 for other paths
  res.statusCode = 404;
  res.end(JSON.stringify({
    error: 'Not Found'
  }));
});

console.log('🚀 Starting Secret Network MCP HTTP Server (TEST MODE)...');
server.listen(PORT, () => {
  console.log(`✅ Secret Network MCP HTTP Server started successfully`);
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tools list: http://localhost:${PORT}/api/mcp/tools/list`);
  console.log(`🔧 Tool execution: POST http://localhost:${PORT}/api/mcp/tools/call`);
  console.log('📝 Note: Running in TEST MODE with mock Secret Network data');
});