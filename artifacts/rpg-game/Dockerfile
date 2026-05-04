# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY lib ./lib
COPY artifacts/rpg-game ./artifacts/rpg-game

# Install dependencies
WORKDIR /app/artifacts/rpg-game
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 4173

# Start
CMD ["serve", "-s", "dist", "-l", "4173"]
