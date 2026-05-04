# API Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start
CMD ["pnpm", "run", "start"]
