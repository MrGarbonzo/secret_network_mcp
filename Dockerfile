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

# Debug: List source files and check permissions
RUN echo "=== Source files ===" && \
    ls -la src/ && \
    echo "=== Package.json ===" && \
    cat package.json && \
    echo "=== Node version ===" && \
    node --version && \
    echo "=== NPM version ===" && \
    npm --version && \
    echo "=== TypeScript version ===" && \
    npx tsc --version

# Build TypeScript with maximum verbosity
RUN echo "=== Starting build ===" && \
    npm run build || \
    (echo "=== Build failed, running tsc directly ===" && \
     npx tsc --listFiles --extendedDiagnostics || \
     (echo "=== TypeScript failed, checking for specific issues ===" && \
      npx tsc --noEmit --listFiles && \
      exit 1))

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8002/api/health || exit 1

# Start server
CMD ["npm", "start"]