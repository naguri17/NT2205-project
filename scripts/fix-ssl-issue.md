# 🔒 Fix SSL Certificate Issue

## Vấn đề

- Let's Encrypt rate limit: Đã request 5 certificates trong 168h
- Browser không trust self-signed certificate
- HSTS đang block việc bypass warning

## Giải pháp nhanh: Trust Self-Signed CA

### Bước 1: Download CA Certificate

**Từ máy local:**

```bash
# Download CA certificate từ server
scp ubuntu@15.134.119.222:~/NT2205-project/docker/nginx/ssl/ca.crt ./ca.crt
```

**Hoặc từ server:**

```bash
# Copy CA cert ra nơi dễ access
cat ~/NT2205-project/docker/nginx/ssl/ca.crt
# Copy nội dung và paste vào file ca.crt trên máy local
```

### Bước 2: Trust CA trên Browser

#### 🌐 Chrome/Edge (Windows/Linux)

1. Mở Chrome/Edge
2. Settings → Privacy and Security → Security
3. Scroll xuống "Manage certificates"
4. Tab "Authorities" → "Import"
5. Chọn file `ca.crt`
6. Check "Trust this certificate for identifying websites"
7. OK → Restart browser

#### 🦊 Firefox

1. Settings → Privacy & Security
2. Scroll xuống "Certificates" → "View Certificates"
3. Tab "Authorities" → "Import"
4. Chọn file `ca.crt`
5. Check "Trust this CA to identify websites"
6. OK → Restart browser

#### 🍎 Safari (macOS)

1. Mở Keychain Access
2. File → Import Items → Chọn `ca.crt`
3. Tìm certificate "NT2205 Root CA"
4. Double-click → Expand "Trust"
5. Set "When using this certificate" → "Always Trust"
6. Close → Enter password
7. Restart Safari

### Bước 3: Clear HSTS Cache (Nếu cần)

**Chrome/Edge:**

```
chrome://net-internals/#hsts
→ Delete domain security policies
→ Nhập: lapisweb.online
→ Delete
```

**Firefox:**

- Settings → Privacy & Security → Clear Data
- Check "Site Settings" → Clear Now

### Bước 4: Restart Nginx với config mới

```bash
# Trên server
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production restart nginx
```

---

## Giải pháp khác

### Option 2: Đợi Let's Encrypt Rate Limit Reset

- Rate limit reset: **2025-12-25 13:42:41 UTC**
- Sau đó chạy lại: `pnpm setup:letsencrypt`

### Option 3: Dùng Let's Encrypt Staging (Test)

```bash
# Chỉnh script init-letsencrypt.sh để dùng staging
# Thay --staging flag trong certbot command
```

---

## Verify SSL

Sau khi trust CA:

```bash
curl -v https://admin.lapisweb.online/api/health
# Sẽ không còn SSL error
```

---

## Lưu ý

- Self-signed certificate chỉ phù hợp cho **development/testing**
- Production nên dùng Let's Encrypt hoặc commercial CA
- Sau khi trust CA, browser sẽ không hiện warning nữa
- HSTS max-age đã giảm xuống 1 ngày để dễ test
