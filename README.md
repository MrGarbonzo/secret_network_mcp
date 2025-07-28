# Secret Network MCP Server

A standalone HTTP API server providing Secret Network blockchain tools for Model Context Protocol (MCP) clients.

## Overview

This server provides real-time access to Secret Network blockchain data through a REST API, replacing the previous stdio-based MCP implementation. It's designed to run as a standalone service that can be deployed independently from the main secretGPT hub.

## Features

- **HTTP API**: REST endpoints for tool execution and management
- **Secret Network Tools**: Balance queries, block info, transactions, contracts, and network status
- **Docker Support**: Ready for containerized deployment
- **Health Monitoring**: Built-in health check endpoints
- **Independent Deployment**: Runs separately from the main hub

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/mcp/tools/list` - List available tools
- `POST /api/mcp/tools/call` - Execute MCP tool

## Available Tools

- `secret_query_balance` - Query SCRT balance for an address
- `secret_query_block` - Get block information
- `secret_query_account` - Get account details
- `secret_query_transaction` - Look up transaction by hash
- `secret_query_contract` - Query smart contract state
- `secret_network_status` - Get network status and info

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the server:
   ```bash
   npm run build
   ```

3. Start the HTTP server:
   ```bash
   npm start
   ```

4. Test the server:
   ```bash
   curl http://localhost:8002/api/health
   ```

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t secret-network-mcp .
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up
   ```

## Environment Variables

- `PORT` - Server port (default: 8002)
- `SECRET_NODE_URL` - Secret Network RPC URL (default: https://api.secret.network)
- `SECRET_CHAIN_ID` - Chain ID (default: secret-4)

## Architecture

This server is part of a two-VM architecture:

- **VM 1**: secretGPT Hub (main application)
- **VM 2**: Secret Network MCP Server (this service)

The hub communicates with this server via HTTP requests, providing complete independence and fault isolation.

## Development

### Scripts

- `npm run build` - Build TypeScript
- `npm start` - Start HTTP server
- `npm run start:mcp` - Start in MCP stdio mode (legacy)
- `npm run dev:http` - Development mode with auto-rebuild
- `npm test` - Run tests

### Testing

Test the server with curl:

```bash
# Health check
curl http://localhost:8002/api/health

# List tools
curl http://localhost:8002/api/mcp/tools/list

# Execute tool
curl -X POST http://localhost:8002/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "secret_network_status", "arguments": {}}'
```

## Deployment

The server is automatically built and pushed to GitHub Container Registry via GitHub Actions. The resulting image can be deployed to any container platform.

### Production Deployment

```yaml
services:
  secret-network-mcp:
    image: ghcr.io/[org]/secret_network_mcp:latest
    ports:
      - "8002:8002"
    environment:
      - PORT=8002
      - SECRET_NODE_URL=https://api.secret.network
```

## License

MIT