FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --verbose

# Copy source code
COPY . .

# Debug: List source files
RUN echo "Source files:" && ls -la src/

# Build TypeScript with better error reporting
RUN npm run build 2>&1 || (echo "Build failed with exit code $?. Output above." && exit 1)

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8002/api/health || exit 1

# Start server
CMD ["npm", "start"]