FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/product-service/package.json ./apps/product-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/product-service/ ./apps/product-service/

EXPOSE 8000

WORKDIR /app/apps/product-service
CMD ["pnpm", "start"]
