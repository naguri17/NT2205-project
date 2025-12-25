# NT2205 E-commerce Microservices Project

Dự án E-commerce sử dụng kiến trúc Microservices cho doanh nghiệp nhỏ.

## 🏗️ Kiến trúc hệ thống

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                       │
│                              │                                           │
│                         ┌────▼────┐                                     │
│                         │  Nginx  │  (Reverse Proxy + SSL Termination)  │
│                         └────┬────┘                                     │
│           ┌──────────────────┼──────────────────┐                       │
│           │                  │                  │                       │
│     ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐               │
│     │  Client   │     │    Admin    │    │    Kong     │               │
│     │  NextJS   │     │   NextJS    │    │   Gateway   │               │
│     │ :3000     │     │   :3001     │    │   :9000     │               │
│     └───────────┘     └─────────────┘    └──────┬──────┘               │
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
| **Client/Admin**     | Next.js 15, React 19, TailwindCSS |
| **Reverse Proxy**    | Nginx (SSL Termination)           |
| **API Gateway**      | Kong Gateway (DB-less)            |
| **Auth**             | Keycloak 26.4.4 (OIDC)            |
| **Microservices**    | Express, Fastify, Hono            |
| **Message Queue**    | Apache Kafka (KRaft)              |
| **Database**         | PostgreSQL 15, MongoDB Atlas      |
| **Containerization** | Docker, Docker Compose            |
| **Monorepo**         | Turborepo, PNPM                   |
| **Monitoring**       | CloudWatch (Production)           |

---

## 🚀 Yêu cầu hệ thống

- **Docker & Docker Desktop** (đang chạy)
- **Node.js** (>= 18)
- **PNPM** (`npm install -g pnpm`)
- **Git**
- **OpenSSL** (để tạo SSL certificates)

---

## 🛠️ Cài đặt & Chạy dự án

### 📦 Yêu cầu hệ thống

- **Docker & Docker Desktop** (đang chạy)
- **Node.js** (>= 18)
- **PNPM** (`npm install -g pnpm`)
- **Git**
- **OpenSSL** (để tạo SSL certificates)

---

## 🏠 Local Development

### Bước 1: Clone dự án

```bash
git clone <link-repo>
cd NT2205-project
```

### Bước 2: Setup môi trường (Lần đầu)

**Option A: Setup tự động (Khuyến nghị)**

```bash
# Script này sẽ:
# 1. Cài dependencies (pnpm install)
# 2. Tạo các file .env (pnpm setup:env)
# 3. Khởi động Docker services (pnpm docker:local)
# 4. Setup database (pnpm setup:db)
# 5. Đợi 30s để services khởi động xong
pnpm setup:local
```

**Option B: Setup thủ công**

```bash
# 1. Cài dependencies
pnpm install

# 2. Tạo các file .env
pnpm setup:env

# 3. Khởi động Docker services (Postgres, Keycloak, Kafka, Kong)
pnpm docker:local

# 4. Chờ ~30s để services khởi động xong, sau đó setup database
pnpm setup:db
```

### Bước 3: Chạy các services

```bash
# Chạy tất cả services (client, admin, microservices) ở chế độ development
pnpm dev
```

**Hoặc chạy kết hợp Docker + Dev:**

```bash
# Khởi động Docker và chạy dev services cùng lúc
pnpm dev:local
```

### Bước 4: Truy cập ứng dụng

| Service              | URL                     | Credentials       |
| -------------------- | ----------------------- | ----------------- |
| **Client App**       | <http://localhost:3000> | Google Login      |
| **Admin Dashboard**  | <http://localhost:3001> | `admin` / `admin` |
| **Keycloak Console** | <http://localhost:8080> | `admin` / `admin` |
| **Kafka UI**         | <http://localhost:8090> | -                 |
| **Kong Gateway**     | <http://localhost:9000> | -                 |

### ⚠️ Lưu ý cho Local Development

- **Docker services** cần chạy trước khi start các ứng dụng
- Sử dụng `docker-compose.local.yml` (không có CloudWatch logging)
- Keycloak chạy ở chế độ `start-dev` (hot reload)
- Logs được lưu trong Docker containers (không gửi lên CloudWatch)

### 🔧 Commands hữu ích (Local)

```bash
# Dừng Docker services
pnpm docker:local:down

# Xem logs Docker
pnpm docker:logs

# Restart Docker services
pnpm docker:local:down && pnpm docker:local
```

---

## 🚀 Production Deployment

### 📋 Yêu cầu Production Server

- **EC2/VPS** với Ubuntu/Debian
- **Docker & Docker Compose** đã cài đặt
- **Node.js >= 18** và **PNPM** đã cài đặt
- **Domain names** đã cấu hình DNS trỏ về server
- **PM2** (sẽ được cài tự động) để quản lý Node.js processes
- **(Optional) AWS CloudWatch** để log monitoring

### Bước 1: Chuẩn bị server

```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài Node.js & PNPM
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install 20
fnm use 20
npm install -g pnpm

# Cài PM2 (global)
npm install -g pm2

# (Optional) Cài CloudWatch Agent (nếu dùng AWS)
sudo apt install amazon-cloudwatch-agent
aws logs create-log-group --log-group-name /nt2205/prod/docker --region ap-southeast-2
```

### Bước 2: Clone và setup (Lần đầu)

**Option A: Setup tự động (Khuyến nghị)**

```bash
git clone <repo>
cd NT2205-project

# Script này sẽ:
# 1. Cài dependencies (pnpm install)
# 2. Tạo các file .env và .env.production (pnpm setup:env)
# 3. Tạo SSL certificates (pnpm setup:ssl)
# 4. Khởi động Docker services (pnpm docker:prod)
# 5. Setup database (pnpm setup:db)
# 6. Đợi 30s để services khởi động xong
pnpm setup:prod
```

**Option B: Setup thủ công**

```bash
# 1. Clone repository
git clone <repo>
cd NT2205-project

# 2. Cài dependencies
pnpm install

# 3. Tạo các file .env và .env.production
pnpm setup:env

# 4. Tạo SSL certificates (self-signed)
pnpm setup:ssl
# Certificates được lưu tại: docker/nginx/ssl/

# 5. Khởi động Docker services (Postgres, Keycloak, Kafka, Kong, Nginx)
pnpm docker:prod

# 6. Chờ ~30s, sau đó setup database
pnpm setup:db
```

### Bước 3: Cấu hình DNS

Thêm các A records trỏ về IP server (ví dụ: 15.134.119.222):

| Record  | Type | Value          |
| ------- | ---- | -------------- |
| `app`   | A    | [YOUR_IP]      |
| `admin` | A    | [YOUR_IP]      |
| `api`   | A    | [YOUR_IP]      |
| `auth`  | A    | [YOUR_IP]      |

### Bước 4: Deploy ứng dụng

```bash
# Script này sẽ:
# 1. Build tất cả Next.js apps (pnpm build)
# 2. Start PM2 với tất cả apps (pnpm pm2:start)
# 3. Đợi admin app ready (wait-for-admin.sh)
# 4. Restart nginx để kết nối với apps
pnpm deploy:prod
```

**Chi tiết các bước:**

1. **Build production**:

   ```bash
   pnpm build
   ```

2. **Start PM2** (quản lý Node.js processes):

   ```bash
   pnpm pm2:start
   ```

   PM2 sẽ start:

   - Client app (port 3000)
   - Admin app (port 3001)
   - Product service (port 8000)
   - Order service (port 8001)
   - Payment service (port 8002)

3. **Đợi admin app ready**:

   ```bash
   bash scripts/wait-for-admin.sh
   ```

   Script sẽ check `/api/health` endpoint, tối đa 60s

4. **Restart nginx** (để kết nối với apps đã ready):

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production restart nginx
   ```

### Bước 5: Truy cập ứng dụng Production

| Service             | URL                             |
| ------------------- | ------------------------------- |
| **Client App**      | <https://app.lapisweb.online>   |
| **Admin Dashboard** | <https://admin.lapisweb.online> |
| **API Gateway**     | <https://api.lapisweb.online>   |
| **Keycloak**        | <https://auth.lapisweb.online>  |

### ⚠️ Lưu ý quan trọng cho Production

1. **Thứ tự khởi động**:
   - ✅ **Đúng**: Start Docker services → Build apps → Start PM2 → Đợi ready → Restart nginx
   - ❌ **Sai**: Start nginx trước khi apps ready → sẽ có 502 errors

2. **PM2 Startup**:
   - Chạy `pm2 startup` để PM2 tự động start khi server reboot
   - Chạy `pm2 save` để lưu current process list

3. **Environment Variables**:
   - Local: Sử dụng `.env` files
   - Production: Sử dụng `.env.production` files
   - Đảm bảo đã config đúng các biến môi trường trong `.env.production`

4. **SSL Certificates**:
   - Dự án sử dụng **self-signed certificates** (phù hợp cho môn học)
   - Để browser trust, import CA certificate: `docker/nginx/ssl/ca.crt`
   - Xem hướng dẫn import ở phần [SSL Certificates](#-ssl-certificates)

### 🔧 Commands hữu ích (Production)

```bash
# Kiểm tra status
pnpm pm2:status          # Xem PM2 processes
pnpm docker:logs         # Xem Docker logs

# Restart services
pnpm pm2:restart         # Restart tất cả PM2 apps
pnpm pm2:restart admin   # Restart chỉ admin app
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production restart nginx

# Dừng services
pnpm pm2:stop            # Dừng PM2 apps
pnpm docker:prod:down    # Dừng Docker services

# Xem logs
pnpm pm2:logs            # Xem PM2 logs
pnpm docker:logs         # Xem Docker logs
```

### 📖 Tài liệu chi tiết

Xem thêm **[DEPLOYMENT.md](./DEPLOYMENT.md)** để biết:

- Thứ tự khởi động chi tiết
- Troubleshooting các vấn đề thường gặp
- Health check endpoints
- Monitoring và logging

---

## 📋 Scripts

### 🏠 Local Development Scripts

```bash
# Setup & Chạy
pnpm setup:local          # Setup đầy đủ lần đầu (install + env + docker + db)
pnpm dev                  # Chạy tất cả services ở dev mode
pnpm dev:local            # Chạy Docker + Dev services cùng lúc

# Docker (Local)
pnpm docker:local         # Khởi động Docker services (local config)
pnpm docker:local:down    # Dừng Docker services (local)
pnpm docker:logs          # Xem Docker logs

# Environment & Database
pnpm setup:env            # Tạo các file .env
pnpm setup:db             # Setup Prisma database (migrations)
```

### 🚀 Production Scripts

```bash
# Setup & Deploy
pnpm setup:prod           # Setup đầy đủ lần đầu (install + env + ssl + docker + db)
pnpm deploy:prod          # Deploy mới (build + pm2:start + wait + restart nginx)

# Docker (Production)
pnpm docker:prod          # Khởi động Docker services (production config)
pnpm docker:prod:down     # Dừng Docker services (production)

# PM2 Management
pnpm pm2:start            # Start tất cả apps với PM2
pnpm pm2:stop             # Dừng tất cả PM2 apps
pnpm pm2:restart          # Restart tất cả PM2 apps
pnpm pm2:restart admin    # Restart chỉ admin app
pnpm pm2:status           # Xem status PM2 processes
pnpm pm2:logs             # Xem PM2 logs
pnpm pm2:monit            # PM2 monitoring dashboard
pnpm pm2:save             # Lưu current PM2 process list
pnpm pm2:delete           # Xóa tất cả PM2 processes

# SSL & Environment
pnpm setup:ssl            # Tạo SSL certificates (self-signed)
pnpm setup:letsencrypt    # Setup Let's Encrypt SSL (nếu dùng)
pnpm ssl:renew            # Renew SSL certificates
```

### 🛠️ Common Scripts

```bash
# Build & Lint
pnpm build                # Build tất cả apps (production)
pnpm start                # Start tất cả apps (production mode với PM2)
pnpm lint                 # Check linting
pnpm check-types          # Check TypeScript types
pnpm format               # Format code với Prettier
```

---

## 📂 Cấu trúc dự án

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
├── scripts/
│   └── generate-ssl.sh   # SSL certificate generator
├── docker-compose.yml        # Base Docker config
├── docker-compose.local.yml  # Local overrides
├── docker-compose.prod.yml   # Production overrides
└── setup-env.js              # Environment setup script
```

---

## 🔐 SSL Certificates

Dự án sử dụng **self-signed certificates** (phù hợp cho môn Mật mã và ứng dụng).

### Import CA vào trình duyệt

Để trình duyệt trust certificates, import file `docker/nginx/ssl/ca.crt`:

- **Chrome**: Settings → Privacy → Security → Manage certificates → Authorities → Import
- **Firefox**: Settings → Privacy → Certificates → View → Authorities → Import
- **macOS**: `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain docker/nginx/ssl/ca.crt`

---

## 🐛 Troubleshooting

### Docker ports bị chiếm

```bash
# Dừng và xóa tất cả containers
docker rm -f $(docker ps -aq)
docker system prune -a --volumes -f

# Chạy lại
pnpm docker:local
```

### Keycloak không khởi động

```bash
# Kiểm tra logs
docker logs nt2205-keycloak

# Restart
docker restart nt2205-keycloak
```

### CloudWatch lỗi ở local

Đảm bảo bạn đang dùng `docker-compose.local.yml` (không có awslogs driver):

```bash
pnpm docker:local  # KHÔNG PHẢI docker compose up
```

---

## 👥 Team

- NT2205 - Mật mã và ứng dụng
- UIT - Đại học Công nghệ Thông tin
