# NT2205 E-commerce Microservices Project

Dự án E-commerce sử dụng kiến trúc Microservices cho doanh nghiệp nhỏ.

## 🏗️ Kiến trúc hệ thống

```
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

## 🛠 Cài đặt & Chạy dự án

### 1. Clone dự án

```bash
git clone <link-repo>
cd NT2205-project
```

### 2. Setup môi trường

```bash
# Cài dependencies và tạo các file .env
pnpm install
pnpm setup:env
```

### 3. Chạy Docker (Local Development)

```bash
# Khởi động infrastructure (Postgres, Keycloak, Kafka, Kong)
pnpm docker:local

# Chờ services khởi động xong (~30s), sau đó setup database
pnpm setup:db
```

### 4. Chạy các services

```bash
# Chạy tất cả services (client, admin, microservices)
pnpm dev
```

### 5. Truy cập ứng dụng

| Service              | URL                     | Credentials       |
| -------------------- | ----------------------- | ----------------- |
| **Client App**       | <http://localhost:3000> | Google Login      |
| **Admin Dashboard**  | <http://localhost:3001> | `admin` / `admin` |
| **Keycloak Console** | <http://localhost:8080> | `admin` / `admin` |
| **Kafka UI**         | <http://localhost:8090> | -                 |
| **Kong Gateway**     | <http://localhost:9000> | -                 |

---

## 🚀 Production Deployment

### 1. Chuẩn bị server (EC2/VPS)

```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Node.js & PNPM
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 20
npm install -g pnpm
```

### 2. Clone và setup

```bash
git clone <repo>
cd NT2205-project
pnpm install
pnpm setup:env
```

### 3. Tạo SSL Certificates (Self-signed)

```bash
# Script sẽ tạo CA và server certificates
pnpm setup:ssl

# Certificates được lưu tại: docker/nginx/ssl/
```

### 4. Cấu hình DNS (GoDaddy)

Thêm các A records trỏ về IP server:

| Record  | Type | Value          |
| ------- | ---- | -------------- |
| `app`   | A    | 15.134.119.222 |
| `admin` | A    | 15.134.119.222 |
| `api`   | A    | 15.134.119.222 |
| `auth`  | A    | 15.134.119.222 |

### 5. Cấu hình CloudWatch (Optional)

```bash
# Cài CloudWatch Agent trên EC2
sudo apt install amazon-cloudwatch-agent

# Tạo log group
aws logs create-log-group --log-group-name /nt2205/prod/docker --region ap-southeast-2
```

### 6. Chạy Production

```bash
# Khởi động với production config
pnpm docker:prod

# Build và chạy NextJS apps
pnpm build
pnpm start
```

### 7. Production URLs

| Service             | URL                             |
| ------------------- | ------------------------------- |
| **Client App**      | <https://app.lapisweb.online>   |
| **Admin Dashboard** | <https://admin.lapisweb.online> |
| **API Gateway**     | <https://api.lapisweb.online>   |
| **Keycloak**        | <https://auth.lapisweb.online>  |

---

## 📋 Scripts

```bash
# Development
pnpm dev                  # Chạy tất cả services (dev mode)
pnpm build                # Build production
pnpm lint                 # Check linting
pnpm check-types          # Check TypeScript

# Environment
pnpm setup:env            # Tạo file .env
pnpm setup:ssl            # Tạo SSL certificates
pnpm setup:db             # Setup Prisma database

# Docker
pnpm docker:local         # Chạy Docker (local)
pnpm docker:local:down    # Dừng Docker (local)
pnpm docker:prod          # Chạy Docker (production)
pnpm docker:prod:down     # Dừng Docker (production)
pnpm docker:logs          # Xem logs

# Full setup
pnpm setup:local          # Setup đầy đủ (local)
pnpm setup:prod           # Setup đầy đủ (production)
```

---

## 📂 Cấu trúc dự án

```
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
