# Multi-stage Dockerfile for Dress2MyDoor backend
# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY package*.json ./
COPY server.js ./
COPY emailService.js ./
COPY app.js ./
COPY models/ ./models/
COPY scripts/ ./scripts/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port (default 5000, can be overridden)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to properly handle signals
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
