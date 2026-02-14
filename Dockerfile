FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Create data directory
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3000
ENV FILE_ROOT=/data
ENV AUTHORIZED_KEYS_PATH=/data/.ssh/authorized_keys

EXPOSE 3000

CMD ["node", "build"]
