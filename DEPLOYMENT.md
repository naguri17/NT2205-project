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

**Lưu ý:** Lúc này Nginx đã start nhưng Next.js apps chưa chạy, nên sẽ có 502 nếu truy cập ngay.

---

### 🔄 Deploy sau đó (Subsequent deployments)

#### Option 1: Dùng script tự động (Recommended)

```bash
pnpm deploy:prod
```

**Thứ tự thực hiện:**

1. ✅ `pnpm build` - Build tất cả Next.js apps (client + admin)
2. ✅ `pnpm pm2:start` - Start PM2 với tất cả apps:
   - Client app (port 3000)
   - Admin app (port 3001)
   - Product service (port 8000)
   - Order service (port 8001)
   - Payment service (port 8002)
3. ✅ `bash scripts/wait-for-admin.sh` - Đợi admin app ready (check `/api/health`)
   - Max 30 attempts, mỗi attempt cách nhau 2s
   - Tổng thời gian tối đa: 60s
4. ✅ `docker compose restart nginx` - Restart nginx để kết nối với apps đã ready

#### Option 2: Manual deployment (Nếu cần control chi tiết)

```bash
# 1. Build apps
pnpm build

# 2. Stop PM2 nếu đang chạy
pnpm pm2:stop

# 3. Start PM2 với apps mới
pnpm pm2:start

# 4. Đợi admin app ready
bash scripts/wait-for-admin.sh

# 5. Restart nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production restart nginx
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

### Phase 2: Applications (PM2)

```
1. Product Service (port 8000)
   ↓
2. Order Service (port 8001)
   ↓
3. Payment Service (port 8002)
   ↓
4. Client App (port 3000)
   ↓
5. Admin App (port 3001) - ⚠️ Cần đợi ready
```

### Phase 3: Finalization

```
1. Wait for Admin App health check
   ↓
2. Restart Nginx (để kết nối với apps)
```

---

## 🔍 Kiểm tra Status

### Check PM2 status

```bash
pnpm pm2:status
# hoặc
pm2 status
```

### Check Docker services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Check logs

```bash
# PM2 logs
pnpm pm2:logs

# Docker logs
pnpm docker:logs

# Specific service
docker compose logs -f nginx
```

### Check health endpoints

```bash
# Admin app
curl http://localhost:3001/api/health

# Client app (nếu có health endpoint)
curl http://localhost:3000/api/health
```

---

## ⚠️ Lưu ý quan trọng

1. **Startup Order**:
   - ❌ KHÔNG start nginx trước khi apps ready → sẽ có 502 errors
   - ✅ Start apps trước → đợi ready → mới start/restart nginx

2. **PM2 Restart**:
   - Khi restart admin app, nginx vẫn có thể forward requests
   - Nginx có retry logic (3 lần) nên sẽ tự retry khi app ready

3. **Health Check**:
   - Admin app có endpoint `/api/health` để check ready status
   - Script `wait-for-admin.sh` sẽ đợi tối đa 60s

4. **Production Build**:
   - Phải build trước khi start (`pnpm build`)
   - Production build chậm hơn dev mode (~3-5s startup time)

---

## 🛠️ Troubleshooting

### Nginx trả về 502

```bash
# Check admin app có đang chạy không
pm2 status admin

# Check port 3001 có listen không
netstat -tlnp | grep 3001

# Check nginx logs
docker compose logs nginx

# Restart admin app
pm2 restart admin
```

### Admin app không start

```bash
# Check logs
pm2 logs admin

# Check environment variables
cat apps/admin/.env.production

# Manual start để xem errors
cd apps/admin
pnpm start
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
| `pnpm deploy:prod` | Deploy mới (build + start apps + restart nginx) |
| `pnpm pm2:restart` | Restart tất cả PM2 apps |
| `pnpm pm2:restart admin` | Restart chỉ admin app |
| `pnpm docker:prod` | Start Docker services |
| `pnpm docker:prod:down` | Stop Docker services |
