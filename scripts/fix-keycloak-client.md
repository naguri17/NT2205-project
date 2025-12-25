# 🔧 Fix Keycloak Client Configuration

## Vấn đề
Lỗi `unauthorized_client (Invalid client or Invalid client credentials)` xảy ra vì:
1. Redirect URI trong Keycloak không có production URL
2. Client secret có thể không khớp
3. Client có thể chưa được enable đúng cách

## Giải pháp

### Bước 1: Truy cập Keycloak Admin Console

```bash
# Trên server hoặc local
# Truy cập: https://auth.lapisweb.online
# Hoặc: http://localhost:8080 (nếu local)
# Login với admin credentials
```

### Bước 2: Update Admin App Client

1. **Vào Realm**: `NT2205`
2. **Clients** → Tìm `admin-app`
3. **Settings tab**:

   **a) Valid Redirect URIs:**
   ```
   http://localhost:3001/*
   https://admin.lapisweb.online/*
   https://admin.lapisweb.online/api/auth/callback/keycloak
   ```

   **b) Web Origins:**
   ```
   http://localhost:3001
   https://admin.lapisweb.online
   ```

   **c) Root URL:**
   ```
   https://admin.lapisweb.online
   ```

   **d) Base URL:**
   ```
   https://admin.lapisweb.online
   ```

   **e) Admin URL:**
   ```
   https://admin.lapisweb.online
   ```

4. **Credentials tab**:
   - Copy **Secret** value
   - Update vào `.env.production` của admin app

5. **Save**

### Bước 3: Verify Environment Variables

Trên server, check file `.env.production`:

```bash
cd ~/NT2205-project/apps/admin
cat .env.production | grep KEYCLOAK
```

Phải có:
```env
KEYCLOAK_CLIENT_ID=admin-app
KEYCLOAK_CLIENT_SECRET=<secret từ Keycloak>
KEYCLOAK_ISSUER=https://auth.lapisweb.online/realms/NT2205
NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.lapisweb.online/realms/NT2205
```

### Bước 4: Restart Admin App

```bash
pm2 restart admin
```

### Bước 5: Test

1. Clear browser cache và cookies
2. Truy cập: `https://admin.lapisweb.online`
3. Login với Keycloak
4. Kiểm tra không còn reload loop

---

## Quick Fix Script

Nếu có quyền truy cập Keycloak API, có thể dùng script:

```bash
# Update realm configuration
# (Cần Keycloak Admin API access)
```

---

## Troubleshooting

### Vẫn còn lỗi `unauthorized_client`

1. **Check client secret**:
   ```bash
   # Trên server
   cat apps/admin/.env.production | grep KEYCLOAK_CLIENT_SECRET
   # So sánh với Keycloak Admin Console → Clients → admin-app → Credentials → Secret
   ```

2. **Check redirect URI format**:
   - Phải có: `https://admin.lapisweb.online/api/auth/callback/keycloak`
   - Không có trailing slash
   - Phải match chính xác

3. **Check client enabled**:
   - Keycloak → Clients → admin-app → Settings
   - **Enabled**: ON
   - **Standard Flow Enabled**: ON

4. **Check realm settings**:
   - Keycloak → Realm Settings → Login
   - **User registration**: có thể OFF
   - **Forgot password**: có thể ON

### Vẫn còn reload loop

1. **Clear NextAuth cookies**:
   - Browser DevTools → Application → Cookies
   - Xóa tất cả cookies của `admin.lapisweb.online`

2. **Check middleware**:
   - Đảm bảo middleware không redirect loop
   - Check `apps/admin/src/middleware.ts`

3. **Check signin page**:
   - Đảm bảo không có infinite redirect
   - Check `apps/admin/src/app/auth/signin/page.tsx`

---

## Lưu ý

- Sau khi update Keycloak config, phải restart admin app
- Client secret phải match chính xác (case-sensitive)
- Redirect URI phải match chính xác (không có trailing slash)
- Production URL phải dùng HTTPS

