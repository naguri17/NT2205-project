FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/payment-service/package.json ./apps/payment-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/payment-service/ ./apps/payment-service/

EXPOSE 8002

WORKDIR /app/apps/payment-service
CMD ["pnpm", "start"]

