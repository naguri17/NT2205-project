# 🚀 Production Deployment Guide

## Thứ tự chạy trên Production

### 📋 Lần đầu setup (First-time setup)

```bash
pnpm setup:prod
```

**Thứ tự thực hiện:**

1. ✅ `pnpm install` - Cài đặt dependencies
2. ✅ `pnpm setup:env` - Tạo các file `.env` và `.env.production`
3. ✅ `pnpm setup:ssl` - Tạo SSL certificates (self-signed)
4. ✅ `pnpm docker:prod` - Start Docker services (Postgres, Keycloak, Kafka, Kong, Nginx)
5. ✅ `pnpm setup:db` - Setup database (Prisma migrations)
6. ✅ `sleep 30` - Đợi 30s để services khởi động

**Lưu ý:** Lúc này Nginx đã start nhưng backend services chưa được deploy, nên sẽ có 502 nếu truy cập ngay.

---

### 🔄 Deploy sau đó (Subsequent deployments)

#### Option 1: Dùng script tự động (Recommended)

```bash
pnpm deploy:prod
```

**Thứ tự thực hiện:**

1. ✅ `pnpm build` - Build tất cả Next.js apps (client + admin)
2. ✅ `pnpm k8s:build` - Build container images cho backend services
3. ✅ `pnpm k8s:deploy` - Deploy backend services to Kubernetes:
   - Product service (port 8000)
   - Order service (port 8001)
   - Payment service (port 8002)
4. ✅ `bash scripts/wait-for-admin.sh` - Đợi admin app ready (check `/api/health`)
   - Max 30 attempts, mỗi attempt cách nhau 2s
   - Tổng thời gian tối đa: 60s

#### Option 2: Manual deployment (Nếu cần control chi tiết)

```bash
# 1. Build apps
pnpm build

# 2. Build container images
pnpm k8s:build

# 3. Deploy to Kubernetes
pnpm k8s:deploy

# 4. Đợi admin app ready
bash scripts/wait-for-admin.sh

# 5. Check status
pnpm k8s:status
```

---

## 📊 Thứ tự khởi động Services

### Phase 1: Infrastructure (Docker)

```
1. Postgres (Database)
   ↓
2. Keycloak (Auth)
   ↓
3. Kafka Cluster (3 brokers)
   ↓
4. Kong (API Gateway)
   ↓
5. Nginx (Reverse Proxy) - ⚠️ Start nhưng apps chưa ready
```

### Phase 2: Backend Services (Kubernetes Orchestration)

```
1. Product Service (port 8000)
   - Containerized
   - Health checks enabled
   - Auto-recovery configured
   ↓
2. Order Service (port 8001)
   - Containerized
   - Health checks enabled
   - Auto-recovery configured
   ↓
3. Payment Service (port 8002)
   - Containerized
   - Health checks enabled
   - Auto-recovery configured
```

**Kubernetes Orchestration Features:**

- ✅ Automatic health checks (liveness, readiness, startup probes)
- ✅ Auto-recovery on failure
- ✅ Resource management (CPU/memory limits)
- ✅ Service discovery via DNS
- ✅ Rolling updates (zero downtime)

### Phase 3: Frontend Apps (Vercel)

```
1. Client App (port 3000) - Deployed on Vercel
   ↓
2. Admin App (port 3001) - Deployed on Vercel
```

---

## 🔍 Kiểm tra Status

### Check Kubernetes status

```bash
pnpm k8s:status
# hoặc
kubectl get pods --all-namespaces
```

### Check Docker services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Check logs

```bash
# Kubernetes logs
pnpm k8s:logs:product
pnpm k8s:logs:order
pnpm k8s:logs:payment

# Docker logs
pnpm docker:logs

# Specific service
docker compose logs -f nginx
```

### Check health endpoints

```bash
# Admin app (via Vercel)
curl https://admin.lapisweb.online/api/health

# Client app (via Vercel)
curl https://app.lapisweb.online/api/health

# Backend services (via Kong Gateway)
curl https://api.lapisweb.online/api/products
curl https://api.lapisweb.online/api/orders
```

---

## ⚠️ Lưu ý quan trọng

1. **Startup Order**:
   - ❌ KHÔNG start nginx trước khi services ready → sẽ có 502 errors
   - ✅ Start Docker services → Deploy to Kubernetes → đợi ready → verify health

2. **Kubernetes Orchestration**:
   - Services được orchestrate tự động với health checks
   - Kubernetes tự động restart failed containers
   - Rolling updates đảm bảo zero downtime

3. **Health Check**:
   - Admin app có endpoint `/api/health` để check ready status
   - Script `wait-for-admin.sh` sẽ đợi tối đa 60s
   - Kubernetes health probes tự động monitor backend services

4. **Production Build**:
   - Phải build trước khi deploy (`pnpm build`)
   - Container images phải được build trước khi deploy (`pnpm k8s:build`)

---

## 🛠️ Troubleshooting

### Nginx trả về 502

```bash
# Check Kubernetes pods có đang chạy không
pnpm k8s:status

# Check pod logs
pnpm k8s:logs:product
pnpm k8s:logs:order
pnpm k8s:logs:payment

# Check nginx logs
docker compose logs nginx

# Restart Kubernetes deployments
pnpm k8s:restart:product
pnpm k8s:restart:order
pnpm k8s:restart:payment
```

### Backend services không start

```bash
# Check pod status
kubectl get pods -n backend

# Check pod details
kubectl describe pod <pod-name> -n backend

# Check logs
kubectl logs <pod-name> -n backend

# Check events
kubectl get events -n backend --sort-by='.lastTimestamp'
```

### Nginx không connect được

```bash
# Check nginx config
docker compose exec nginx nginx -t

# Check host.docker.internal
docker compose exec nginx ping host.docker.internal

# Restart nginx
docker compose restart nginx
```

---

## 📝 Quick Reference

| Command | Mô tả |
|---------|-------|
| `pnpm setup:prod` | First-time setup (chỉ chạy 1 lần) |
| `pnpm deploy:prod` | Deploy mới (build + k8s deploy) |
| `pnpm k8s:restart:product` | Restart product service |
| `pnpm k8s:restart:order` | Restart order service |
| `pnpm k8s:restart:payment` | Restart payment service |
| `pnpm k8s:status` | Xem Kubernetes pods status |
| `pnpm docker:prod` | Start Docker services |
| `pnpm docker:prod:down` | Stop Docker services |

---

## 🎯 Kubernetes Orchestration Benefits

- ✅ **Containerization**: All services run in Docker containers
- ✅ **Health Checks**: Automatic liveness, readiness, and startup probes
- ✅ **Auto-recovery**: Kubernetes automatically restarts failed containers
- ✅ **Resource Management**: CPU and memory limits per service
- ✅ **Service Discovery**: DNS-based service discovery within cluster
- ✅ **Scaling**: Easy horizontal scaling with `kubectl scale`
- ✅ **Rolling Updates**: Zero-downtime deployments
- ✅ **High Availability**: Multiple replicas per service

---

## 📚 Additional Resources

- [Kubernetes Orchestration Guide](./k8s/ORCHESTRATION.md)
- [Kubernetes Production Guide](./k8s/PRODUCTION.md)
- [Kubernetes Local Guide](./k8s/LOCAL.md)
- [Kubernetes Architecture](./k8s/ARCHITECTURE.md)
