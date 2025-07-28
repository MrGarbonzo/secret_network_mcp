#!/bin/bash

# Script to start Secret Network MCP server
# Tries GHCR image first, falls back to local build if needed

echo "Starting Secret Network MCP server..."

# Try to pull and run the pre-built image from GHCR
echo "Attempting to use pre-built image from GHCR..."
if docker-compose -f docker-compose.prod.yml pull 2>/dev/null; then
    echo "Successfully pulled image from GHCR, starting service..."
    docker-compose -f docker-compose.prod.yml up -d
else
    echo "Failed to pull from GHCR, falling back to local build..."
    echo "Building image locally..."
    docker-compose -f docker-compose.local.yml up -d --build
fi

# Check if the service is running
sleep 5
if curl -f http://localhost:8002/api/health 2>/dev/null; then
    echo "✅ Secret Network MCP server is running successfully!"
    echo "🌐 Service available at: http://localhost:8002"
    echo "🏥 Health check: http://localhost:8002/api/health"
else
    echo "❌ Failed to start Secret Network MCP server"
    echo "📋 Check logs with: docker-compose logs"
    exit 1
fi