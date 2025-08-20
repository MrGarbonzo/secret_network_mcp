#!/bin/bash
set -e

echo "Building secret_network_mcp Docker image with token functionality..."

# Get the current git commit for tagging
GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git branch --show-current)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Image tags
REGISTRY="ghcr.io/mrgarbonzo"
IMAGE_NAME="scrt_network_mcp"
TAG_LATEST="${REGISTRY}/${IMAGE_NAME}:latest"
TAG_BRANCH="${REGISTRY}/${IMAGE_NAME}:${GIT_BRANCH}-latest"
TAG_COMMIT="${REGISTRY}/${IMAGE_NAME}:${GIT_BRANCH}-${GIT_COMMIT}"
TAG_TIMESTAMPED="${REGISTRY}/${IMAGE_NAME}:${GIT_BRANCH}-${TIMESTAMP}"

echo "Building image with tags:"
echo "  - ${TAG_LATEST}"
echo "  - ${TAG_BRANCH}"
echo "  - ${TAG_COMMIT}"
echo "  - ${TAG_TIMESTAMPED}"

# Build the Docker image
echo "Building Docker image..."
docker build \
  -t "${TAG_LATEST}" \
  -t "${TAG_BRANCH}" \
  -t "${TAG_COMMIT}" \
  -t "${TAG_TIMESTAMPED}" \
  .

# Verify the build includes token functionality
echo "Verifying token functionality in built image..."
docker run --rm "${TAG_LATEST}" sh -c "
  echo 'Checking for token registry files...'
  ls -la build/token-registry.js build/query-helpers.js 2>/dev/null || echo 'Token files not found'
  
  echo 'Checking for token tools in http-server...'
  grep -c 'secret_query_token_balance' build/http-server.js || echo 'Token tools not found'
"

echo "Build verification complete!"

# Optional: Push to registry (uncomment when ready)
echo "To push to GitHub Container Registry, run:"
echo "  docker push ${TAG_LATEST}"
echo "  docker push ${TAG_BRANCH}"
echo "  docker push ${TAG_COMMIT}"
echo "  docker push ${TAG_TIMESTAMPED}"

# Update docker-compose.yml to use the new image
echo "Updating docker-compose.yml to use new image..."
sed -i.bak "s|image: ghcr.io/mrgarbonzo/scrt_network_mcp:.*|image: ${TAG_BRANCH}|" docker-compose.yml

echo "Docker-compose updated! New image: ${TAG_BRANCH}"
echo "Run 'docker-compose pull && docker-compose up -d' to deploy"