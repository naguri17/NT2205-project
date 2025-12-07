# NT2205 E-commerce Microservices

This is a Monorepo for the NT2205 E-commerce project, managed by [Turborepo](https://turbo.build/repo). It creates a full-stack e-commerce solution with Microservices architecture.

## 🏗 What's inside?

### Apps (`/apps`)

| Service             | Type     | Tech Stack | Port    | Description                                |
| ------------------- | -------- | ---------- | ------- | ------------------------------------------ |
| **client**          | Frontend | Next.js 14 | `:3000` | Customer storefront (E-commerce site)      |
| **admin**           | Frontend | Next.js 14 | `:3001` | Admin dashboard for management             |
| **product-service** | Backend  | Express    | `:8000` | Manages products & categories (PostgreSQL) |
| **order-service**   | Backend  | Fastify    | `:8001` | Manages orders (MongoDB)                   |
| **payment-service** | Backend  | Hono       | `:8002` | Handles payments & Webhooks (Stripe)       |

### Infrastructure (`/docker`)

- **Keycloak**: Identity Provider (OAuth2/OpenID Connect).
- **Kafka & Zookeeper**: Message broker for async communication between services.
- **PostgreSQL**: Database for Product Service.
- **Kafka UI**: Visual interface for managing Kafka clusters.

### Packages (`/packages`)

- `kafka`: Shared Kafka producer/consumer utilities.
- `order-db`, `product-db`: Prisma ORM configurations and clients.
- `types`: Shared TypeScript interfaces/types.
- `eslint-config`, `typescript-config`: Shared linting and TS configs.

---

## 🚀 Quick Start (For Teammates)

### Prerequisites

- **Node.js** (v18+)
- **pnpm** (Package manager)
- **Docker & Docker Compose** (Running)

### 1. Setup Environment

We have a script to automate the setup process (create `.env` files, install dependencies, start Docker containers, and push DB schema).

Run this single command from the root
