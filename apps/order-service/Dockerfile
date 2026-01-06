FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/order-service/package.json ./apps/order-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/order-service/ ./apps/order-service/

EXPOSE 8001

WORKDIR /app/apps/order-service
CMD ["pnpm", "start"]

