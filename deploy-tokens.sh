#!/bin/bash
set -e

echo "🚀 Deploying secret_network_mcp with token functionality..."

# Build the Docker image with token functionality
echo "1. Building Docker image..."
docker build -t ghcr.io/mrgarbonzo/scrt_network_mcp:keplr-tokens .

# Verify token functionality is included
echo "2. Verifying token functionality..."
docker run --rm ghcr.io/mrgarbonzo/scrt_network_mcp:keplr-tokens sh -c "
echo 'Token registry files:'
ls -la build/token-registry.js build/query-helpers.js
echo 'Token tools in http-server:'
grep -c 'secret_query_token_balance' build/http-server.js
echo 'Verification complete!'
"

# Test the image locally first
echo "3. Testing image locally..."
docker run --rm -d -p 8003:8002 --name test-token-server ghcr.io/mrgarbonzo/scrt_network_mcp:keplr-tokens

# Wait for server to start
echo "Waiting for test server to start..."
sleep 10

# Test token tools endpoint
echo "Testing token tools discovery..."
TOOLS_COUNT=$(curl -s http://localhost:8003/api/mcp/tools/list | jq '.tools | length' 2>/dev/null || echo "0")
TOKEN_TOOLS=$(curl -s http://localhost:8003/api/mcp/tools/list | jq '.tools[].name' 2>/dev/null | grep -c token || echo "0")

echo "Found $TOOLS_COUNT total tools, $TOKEN_TOOLS token tools"

# Clean up test container
docker stop test-token-server || true

if [ "$TOOLS_COUNT" -ge "12" ] && [ "$TOKEN_TOOLS" -ge "4" ]; then
    echo "✅ Token functionality verified!"
else
    echo "❌ Token functionality test failed!"
    exit 1
fi

# Push to registry (optional - uncomment when ready)
echo "4. To push to GitHub Container Registry, run:"
echo "   docker push ghcr.io/mrgarbonzo/scrt_network_mcp:keplr-tokens"

# Deploy with docker-compose
echo "5. Deploying with docker-compose..."
docker-compose down || true
docker-compose pull
docker-compose up -d

echo "6. Waiting for deployment to stabilize..."
sleep 15

# Test the deployed service
echo "7. Testing deployed service..."
HEALTH_CHECK=$(curl -s http://localhost:8002/api/health | jq '.status' 2>/dev/null || echo "error")
DEPLOYED_TOOLS=$(curl -s http://localhost:8002/api/mcp/tools/list | jq '.tools | length' 2>/dev/null || echo "0")

echo "Health status: $HEALTH_CHECK"
echo "Tools available: $DEPLOYED_TOOLS"

if [ "$HEALTH_CHECK" = '"healthy"' ] && [ "$DEPLOYED_TOOLS" -ge "12" ]; then
    echo "🎉 Deployment successful! Token functionality is live."
    echo ""
    echo "Available token tools:"
    curl -s http://localhost:8002/api/mcp/tools/list | jq '.tools[].name' | grep token
    echo ""
    echo "Test with: curl -s http://localhost:8002/api/mcp/tools/list | jq '.'"
else
    echo "❌ Deployment verification failed!"
    echo "Check logs with: docker-compose logs"
    exit 1
fi