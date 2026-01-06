# NT2205 E-commerce Microservices Project

E-commerce project using Microservices architecture for small businesses.

## 📋 Table of Contents

- [System Architecture](#-system-architecture)
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
- [Project Setup](#-project-setup)
- [Running the Project](#-running-the-project)
- [Development](#-development)
- [Deployment](#-deployment)
- [Vercel Deployment](#-vercel-deployment)
- [Kubernetes Deployment](#-kubernetes-deployment-optional)
- [Scripts Reference](#-scripts-reference)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                       │
│                              │                                           │
│           ┌──────────────────┼──────────────────┐                       │
│           │                  │                  │                       │
│     ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐               │
│     │  Client   │     │    Admin    │    │    Kong     │               │
│     │  NextJS   │     │   NextJS    │    │   Gateway   │               │
│     │  Vercel   │     │   Vercel    │    │   :9000     │               │
│     │  (Edge)   │     │   (Edge)    │    └──────┬──────┘               │
│     └───────────┘     └─────────────┘          │                       │
│                                                 │                       │
│          ┌──────────────────┬──────────────────┼──────────────────┐    │
│          │                  │                  │                  │    │
│    ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
│    │  Product  │     │    Order    │    │   Payment   │    │  Keycloak   │
│    │  Service  │     │   Service   │    │   Service   │    │   (Auth)    │
│    │   :8000   │     │    :8001    │    │    :8002    │    │   :8080     │
│    └─────┬─────┘     └──────┬──────┘    └──────┬──────┘    └─────────────┘
│          │                  │                  │                        │
│          │            ┌─────▼─────┐            │                        │
│          │            │   Kafka   │◄───────────┘                        │
│          │            │  Cluster  │                                     │
│          │            └───────────┘                                     │
│          │                                                              │
│    ┌─────▼─────┐                         ┌─────────────┐               │
│    │ PostgreSQL│                         │   MongoDB   │               │
│    │   :5432   │                         │   (Atlas)   │               │
│    └───────────┘                         └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component            | Technology                        |
| -------------------- | --------------------------------- |
| **Client/Admin**     | Next.js 15, React 19, TailwindCSS, Vercel (Edge) |
| **Reverse Proxy**    | Nginx (SSL Termination) - Production only |
| **API Gateway**      | Kong Gateway (DB-less)            |
| **Auth**             | Keycloak 26.4.4 (OIDC)            |
| **Microservices**    | Express, Fastify, Hono            |
| **Message Queue**    | Apache Kafka (KRaft)              |
| **Database**         | PostgreSQL 15, MongoDB Atlas      |
| **Containerization** | Docker, Docker Compose            |
| **Orchestration**    | Kubernetes (K3s)                  |
| **Monorepo**         | Turborepo, PNPM                   |
| **Hosting**          | Vercel (Edge) - Client/Admin, EC2/VPS - Backend |
| **Monitoring**       | CloudWatch (Production)            |

---

## 🛠️ System Requirements

### Local Development

- **Docker & Docker Desktop** (running)
- **Node.js** (>= 18)
- **PNPM** (`npm install -g pnpm`)
- **Git**
- **OpenSSL** (for generating SSL certificates - optional for local)

### Production Server

- **EC2/VPS** with Ubuntu/Debian (for backend services)
- **Docker & Docker Compose** installed
- **Kubernetes (K3s)** to orchestrate backend services
- **kubectl** to manage Kubernetes cluster
- **(Optional) AWS CloudWatch** for log monitoring

### Vercel Deployment (Client/Admin)

- **Vercel account** (free tier available)
- **Vercel CLI** (optional, for manual deployment)
- **GitHub/GitLab/Bitbucket** repository connected to Vercel

---

## 📦 Installation

### 1. Clone repository

```bash
git clone <repository-url>
cd NT2205-project
```

### 2. Install dependencies

```bash
# Install PNPM if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 3. Install Docker (if not already installed)

**Linux:**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS/Windows:**

- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 4. Install Kubernetes (K3s) - For Production

```bash
# Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Configure kubectl
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config
```

---

## ⚙️ Project Setup

### 🏠 Local Development Setup

#### Option A: Automated Setup (Recommended)

```bash
# This script will:
# 1. Install dependencies (pnpm install)
# 2. Create .env files (pnpm setup:env)
# 3. Start Docker services (pnpm docker:local)
# 4. Setup database (pnpm setup:db)
# 5. Wait 30s for services to start
pnpm setup:local
```

#### Option B: Manual Setup

```bash
# 1. Create .env files
pnpm setup:env

# 2. Start Docker services (Postgres, Keycloak, Kafka, Kong)
pnpm docker:local

# 3. Wait ~30s for services to start, then setup database
sleep 30
pnpm setup:db
```

### 🚀 Production Setup

#### Option A: Automated Setup (Recommended)

```bash
# This script will:
# 1. Install dependencies (pnpm install)
# 2. Create .env and .env.production files (pnpm setup:env)
# 3. Generate SSL certificates (pnpm setup:ssl)
# 4. Start Docker services (pnpm docker:prod)
# 5. Setup database (pnpm setup:db)
# 6. Wait 30s for services to start
pnpm setup:prod
```

#### Option B: Manual Setup

```bash
# 1. Create .env and .env.production files
pnpm setup:env

# 2. Generate SSL certificates (self-signed)
pnpm setup:ssl
# Certificates are saved at: docker/nginx/ssl/

# 3. Start Docker services (Postgres, Keycloak, Kafka, Kong, Nginx)
pnpm docker:prod

# 4. Wait ~30s, then setup database
sleep 30
pnpm setup:db
```

#### DNS Configuration

**Backend Services (EC2/VPS):**
Add A records pointing to server IP (e.g., 15.134.119.222):

| Record  | Type | Value          | Purpose        |
| ------- | ---- | -------------- | -------------- |
| `api`   | A    | [YOUR_IP]      | Kong Gateway   |
| `auth`  | A    | [YOUR_IP]      | Keycloak       |

**Frontend Apps (Vercel):**
Vercel will automatically configure DNS when you deploy. You can:

- Use Vercel subdomain: `your-app.vercel.app`
- Or configure custom domain in Vercel dashboard

| Record  | Type | Value                    | Purpose        |
| ------- | ---- | ------------------------ | -------------- |
| `app`   | CNAME| cname.vercel-dns.com     | Client App     |
| `admin` | CNAME| cname.vercel-dns.com     | Admin Dashboard|

---

## ▶️ Running the Project

### 🏠 Local Development

#### Run all services

```bash
# Run all services (client, admin, microservices) in development mode
pnpm dev
```

#### Run Docker + Dev together

```bash
# Start Docker and run dev services simultaneously
pnpm dev:local
```

#### Access applications

| Service              | URL                     | Credentials       |
| -------------------- | ----------------------- | ----------------- |
| **Client App**       | <http://localhost:3000> | Google Login      |
| **Admin Dashboard**  | <http://localhost:3001> | `admin` / `admin` |
| **Keycloak Console** | <http://localhost:8080> | `admin` / `admin` |
| **Kafka UI**         | <http://localhost:8090> | -                 |
| **Kong Gateway**     | <http://localhost:9000> | -                 |

#### Notes for Local Development

- **Docker services** must run before starting applications
- Use `docker-compose.local.yml` (no CloudWatch logging)
- Keycloak runs in `start-dev` mode (hot reload)
- Logs are stored in Docker containers (not sent to CloudWatch)

### 🚀 Production

#### Deploy Backend Services (EC2/VPS)

```bash
# This script will:
# 1. Build container images
# 2. Deploy to Kubernetes (proper orchestration)
pnpm deploy:prod
```

#### Detailed Steps

1. **Build container images**:

   ```bash
   pnpm k8s:build
   ```

   Builds images for:
   - Product service
   - Order service
   - Payment service

2. **Deploy to Kubernetes**:

   ```bash
   pnpm k8s:deploy
   ```

   Kubernetes orchestrates:
   - Container lifecycle management
   - Health checks and auto-recovery
   - Resource management
   - Service discovery
   - Scaling

3. **Check services**:

   ```bash
   pnpm k8s:status
   ```

#### Deploy Frontend Apps (Vercel)

See details in [Vercel Deployment](#-vercel-deployment) section

#### Access Production Applications

| Service             | URL                             | Hosting        |
| ------------------- | ------------------------------- | -------------- |
| **Client App**      | <https://app.lapisweb.online>   | Vercel (Edge)  |
| **Admin Dashboard** | <https://admin.lapisweb.online> | Vercel (Edge)  |
| **API Gateway**     | <https://api.lapisweb.online>   | EC2/VPS        |
| **Keycloak**        | <https://auth.lapisweb.online>  | EC2/VPS        |

#### Important Notes for Production

1. **Backend Startup Order**:
   - ✅ **Correct**: Start Docker services → Deploy to Kubernetes → Verify health
   - ❌ **Wrong**: Deploy services before Docker is ready → connection errors

2. **Kubernetes Orchestration**:
   - Kubernetes automatically manages container lifecycle
   - Health checks and auto-recovery are automatically configured
   - Services are orchestrated with proper resource management

3. **Environment Variables**:
   - Backend: Use Kubernetes ConfigMaps and Secrets
   - Frontend: Configure in Vercel dashboard or `vercel.json`
   - Ensure all environment variables are correctly configured

4. **SSL Certificates**:
   - Backend: Project uses **self-signed certificates** (suitable for coursework)
   - Frontend: Vercel automatically provides SSL certificates
   - To make browsers trust backend certificates, import CA certificate: `docker/nginx/ssl/ca.crt`
   - See import instructions in [SSL Certificates](#-ssl-certificates) section

---

## 💻 Development

### Development Workflow

1. **Start Docker services** (if not already running):

   ```bash
   pnpm docker:local
   ```

2. **Start development servers**:

   ```bash
   pnpm dev
   ```

   Or run each service separately:

   ```bash
   # Client app
   cd apps/client && pnpm dev
   
   # Admin app
   cd apps/admin && pnpm dev
   
   # Product service
   cd apps/product-service && pnpm dev
   
   # Order service
   cd apps/order-service && pnpm dev
   
   # Payment service
   cd apps/payment-service && pnpm dev
   ```

3. **Hot Reload**: All services support hot reload, code changes will automatically reload

### Code Quality

```bash
# Lint code
pnpm lint

# Check TypeScript types
pnpm check-types

# Format code with Prettier
pnpm format
```

### Database Migrations

```bash
# Generate Prisma client
cd packages/product-db
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Or from root
pnpm setup:db
```

### Testing

```bash
# Run tests (if available)
pnpm test
```

---

## 🚀 Deployment

### 🏠 Local Deployment (Testing Production Build)

```bash
# 1. Build production
pnpm build

# 2. Start Docker services
pnpm docker:local

# 3. Build and deploy backend services to Kubernetes
pnpm k8s:build
pnpm k8s:deploy

# 4. Start frontend apps locally
cd apps/client && pnpm start
cd apps/admin && pnpm start

# 5. Check status
pnpm k8s:status
```

### 🚀 Production Deployment

#### Backend Services (EC2/VPS)

See details in [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Deploy:**

```bash
# First-time setup
pnpm setup:prod

# Subsequent deployments
pnpm deploy:prod
```

**Manual Deployment Steps:**

1. **Update code**:

   ```bash
   git pull origin main
   ```

2. **Install dependencies** (if changed):

   ```bash
   pnpm install
   ```

3. **Restart backend services**:

   ```bash
   # Restart Kubernetes deployments
   pnpm k8s:restart:product
   pnpm k8s:restart:order
   pnpm k8s:restart:payment
   
   # Check status
   pnpm k8s:status
   ```

#### Frontend Apps (Vercel)

See details in [Vercel Deployment](#-vercel-deployment) section

### Useful Commands (Production Backend)

```bash
# Check status
pnpm k8s:status          # View Kubernetes pods
pnpm docker:logs         # View Docker logs

# Restart services
kubectl rollout restart deployment -n backend  # Restart all backend services
pnpm k8s:restart:product  # Restart only product service
pnpm k8s:restart:order    # Restart only order service
pnpm k8s:restart:payment  # Restart only payment service

# Stop services
pnpm k8s:delete          # Delete Kubernetes deployments
pnpm docker:prod:down    # Stop Docker services

# View logs
pnpm k8s:logs:product     # View product service logs
pnpm k8s:logs:order      # View order service logs
pnpm k8s:logs:payment    # View payment service logs
pnpm docker:logs         # View Docker logs
```

---

## ▲ Vercel Deployment

Client and Admin apps are deployed on Vercel to leverage edge hosting.

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional):

   ```bash
   npm install -g vercel
   ```

### Setup Vercel Projects

#### Option A: Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import repository from GitHub/GitLab/Bitbucket

2. **Configure Client App**:
   - **Project Name**: `client-app` (or your preferred name)
   - **Root Directory**: `apps/client`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && pnpm build --filter=@repo/client`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

3. **Configure Admin App**:
   - Create new project
   - **Project Name**: `admin-app` (or your preferred name)
   - **Root Directory**: `apps/admin`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && pnpm build --filter=@repo/admin`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

#### Option B: Vercel CLI

```bash
# Deploy Client App
cd apps/client
vercel

# Deploy Admin App
cd ../admin
vercel
```

### Environment Variables

Configure environment variables in Vercel Dashboard:

**Client App:**

- `NEXT_PUBLIC_API_URL`: API Gateway URL (e.g., `https://api.lapisweb.online`)
- `NEXT_PUBLIC_AUTH_URL`: Keycloak URL (e.g., `https://auth.lapisweb.online`)
- Other environment variables as needed

**Admin App:**

- `NEXT_PUBLIC_API_URL`: API Gateway URL
- `NEXT_PUBLIC_AUTH_URL`: Keycloak URL
- Other environment variables as needed

### Custom Domains

1. **Add Domain in Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add domain: `app.lapisweb.online` (for Client)
   - Add domain: `admin.lapisweb.online` (for Admin)

2. **Configure DNS**:
   - Add CNAME record pointing to Vercel:
     - `app` → `cname.vercel-dns.com`
     - `admin` → `cname.vercel-dns.com`

### Automatic Deployments

Vercel automatically deploys when:

- Push code to main branch (Production)
- Push code to other branches (Preview deployments)
- Pull requests (Preview deployments)

### Manual Deployment

```bash
# Deploy Client App
cd apps/client
vercel --prod

# Deploy Admin App
cd ../admin
vercel --prod
```

### Vercel Configuration Files

Create `vercel.json` in each app if custom configuration is needed:

**apps/client/vercel.json:**

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter=@repo/client",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

**apps/admin/vercel.json:**

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter=@repo/admin",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Benefits of Vercel Edge Hosting

- ✅ **Global CDN**: Apps are served from nearest edge locations
- ✅ **Automatic SSL**: Vercel automatically provides SSL certificates
- ✅ **Zero Configuration**: No server configuration needed
- ✅ **Automatic Deployments**: Automatically deploys when pushing code
- ✅ **Preview Deployments**: Automatically creates preview for each PR
- ✅ **Analytics**: Built-in analytics and monitoring
- ✅ **Edge Functions**: Support for Edge Functions for serverless functions

---

## ☸️ Kubernetes Deployment (Optional)

Project supports deployment on Kubernetes. See details in [k8s/README.md](./k8s/README.md)

### Quick Start

```bash
# Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Deploy to Kubernetes
cd k8s
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment

```bash
# 1. Create namespaces
kubectl apply -f k8s/namespaces/

# 2. Deploy database
kubectl apply -f k8s/database/

# 3. Deploy authentication
kubectl apply -f k8s/auth/

# 4. Deploy backend services
kubectl apply -f k8s/backend/

# 5. Deploy API Gateway
kubectl apply -f k8s/gateway/
```

See also:

- [Kubernetes Orchestration Guide](./k8s/ORCHESTRATION.md)
- [Kubernetes Architecture](./k8s/ARCHITECTURE.md)
- [Kubernetes Production Guide](./k8s/PRODUCTION.md)
- [Kubernetes Local Guide](./k8s/LOCAL.md)

---

## 📋 Scripts Reference

### 🏠 Local Development Scripts

```bash
# Setup & Run
pnpm setup:local          # Full first-time setup (install + env + docker + db)
pnpm dev                  # Run all services in dev mode
pnpm dev:local            # Run Docker + Dev services together

# Docker (Local)
pnpm docker:local         # Start Docker services (local config)
pnpm docker:local:down    # Stop Docker services (local)
pnpm docker:logs          # View Docker logs

# Environment & Database
pnpm setup:env            # Create .env files
pnpm setup:db             # Setup Prisma database (migrations)
```

### 🚀 Production Scripts (Backend Only)

```bash
# Setup & Deploy
pnpm setup:prod           # Full first-time setup (install + env + ssl + docker + db)
pnpm deploy:prod          # Deploy backend services to Kubernetes

# Docker (Production)
pnpm docker:prod          # Start Docker services (production config)
pnpm docker:prod:down     # Stop Docker services (production)

# Kubernetes Management (Backend Services)
pnpm k8s:build            # Build container images
pnpm k8s:deploy           # Deploy to Kubernetes
pnpm k8s:status           # View Kubernetes pods status
pnpm k8s:logs:product     # View product service logs
pnpm k8s:logs:order       # View order service logs
pnpm k8s:logs:payment     # View payment service logs
pnpm k8s:restart:product  # Restart product service
pnpm k8s:restart:order    # Restart order service
pnpm k8s:restart:payment  # Restart payment service
pnpm k8s:delete           # Delete Kubernetes deployments

# SSL & Environment
pnpm setup:ssl            # Generate SSL certificates (self-signed)
pnpm setup:letsencrypt    # Setup Let's Encrypt SSL (if using)
pnpm ssl:renew            # Renew SSL certificates
```

### ▲ Vercel Scripts (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy Client App
cd apps/client
vercel --prod

# Deploy Admin App
cd ../admin
vercel --prod

# Preview Deployment
vercel

# View Deployments
vercel ls
```

### 🛠️ Common Scripts

```bash
# Build & Lint
pnpm build                # Build all apps (production)
pnpm build --filter=@repo/client  # Build only client app
pnpm build --filter=@repo/admin  # Build only admin app
pnpm k8s:deploy           # Deploy backend services to Kubernetes
pnpm lint                 # Check linting
pnpm check-types          # Check TypeScript types
pnpm format               # Format code with Prettier
```

---

## 📂 Project Structure

```text
NT2205-project/
├── apps/
│   ├── client/           # Frontend (Next.js)
│   ├── admin/            # Admin Dashboard (Next.js)
│   ├── product-service/  # Product API (Express)
│   ├── order-service/    # Order API (Fastify)
│   └── payment-service/  # Payment API (Hono + Stripe)
├── packages/
│   ├── kafka/            # Kafka client library
│   ├── product-db/       # Prisma + PostgreSQL
│   ├── order-db/         # MongoDB connection
│   └── types/            # Shared TypeScript types
├── docker/
│   ├── nginx/            # Nginx config + SSL
│   ├── keycloak/         # Realm configuration
│   └── postgres/         # Database init script
├── kong/
│   └── kong.yaml         # Kong Gateway config
├── k8s/                  # Kubernetes manifests
│   ├── namespaces/       # Namespace definitions
│   ├── database/         # PostgreSQL deployment
│   ├── auth/             # Keycloak deployment
│   ├── backend/          # Microservices deployments
│   └── gateway/          # Kong Gateway deployment
├── scripts/
│   └── generate-ssl.sh   # SSL certificate generator
├── docker-compose.yml        # Base Docker config
├── docker-compose.local.yml  # Local overrides
├── docker-compose.prod.yml   # Production overrides
└── setup-env.js              # Environment setup script
```

---

## 🔐 SSL Certificates

Project uses **self-signed certificates** (suitable for coursework).

### Import CA into Browser

To make browsers trust certificates, import file `docker/nginx/ssl/ca.crt`:

- **Chrome**: Settings → Privacy → Security → Manage certificates → Authorities → Import
- **Firefox**: Settings → Privacy → Certificates → View → Authorities → Import
- **macOS**:

  ```bash
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain docker/nginx/ssl/ca.crt
  ```

- **Linux**:

  ```bash
  sudo cp docker/nginx/ssl/ca.crt /usr/local/share/ca-certificates/nt2205-ca.crt
  sudo update-ca-certificates
  ```

---

## 🐛 Troubleshooting

### Docker ports are occupied

```bash
# Stop and remove all containers
docker rm -f $(docker ps -aq)
docker system prune -a --volumes -f

# Run again
pnpm docker:local
```

### Keycloak won't start

```bash
# Check logs
docker logs nt2205-keycloak

# Restart
docker restart nt2205-keycloak
```

### CloudWatch errors in local

Make sure you're using `docker-compose.local.yml` (no awslogs driver):

```bash
pnpm docker:local  # NOT docker compose up
```

### Backend services won't start

```bash
# Check Kubernetes logs
pnpm k8s:logs:product
pnpm k8s:logs:order
pnpm k8s:logs:payment

# Check pod status
pnpm k8s:status

# Check pod details
kubectl describe pod <pod-name> -n backend

# Check ConfigMaps and Secrets
kubectl get configmap -n backend
kubectl get secret -n backend
```

### Vercel deployment issues

```bash
# Check build logs in Vercel Dashboard
# Or check local build
cd apps/client
pnpm build

# Check environment variables in Vercel Dashboard
# Settings → Environment Variables

# Redeploy
vercel --prod --force
```

### Database connection errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec -it nt2205-postgres psql -U admin -d products

# Restart database
docker restart nt2205-postgres
```

### Kafka connection errors

```bash
# Check Kafka brokers
docker ps | grep kafka

# Check Kafka UI
# Access http://localhost:8090

# Restart Kafka
docker restart kafka-broker-1 kafka-broker-2 kafka-broker-3
```

---

## 📚 References

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment details
- [k8s/README.md](./k8s/README.md) - Kubernetes deployment guide
- [k8s/ARCHITECTURE.md](./k8s/ARCHITECTURE.md) - Kubernetes architecture
- [k8s/ORCHESTRATION.md](./k8s/ORCHESTRATION.md) - Orchestration concepts

---

## 👥 Team

- NT2205 - Cryptography and Applications
- UIT - University of Information Technology

---

## 📝 License

[Add your license here]
