# NT2205 E-commerce Microservices Project

Dự án E-commerce sử dụng kiến trúc Microservices với Next.js, Node.js (Express, Fastify, Hono), Kafka, Keycloak và PostgreSQL.

## 🚀 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt:

- **Docker & Docker Desktop** (Đang chạy)
- **Node.js** (>= 18)
- **PNPM** (`npm install -g pnpm`)
- **Git**

## 🛠 Cài đặt & Chạy dự án (Quick Start)

Dự án đã được tích hợp script tự động hóa hoàn toàn. Bạn chỉ cần chạy **1 lệnh duy nhất** để thiết lập môi trường, database, và authentication.

### 1. Clone dự án

```bash
git clone <link-repo-của-bạn>
cd nt2205-project
```

### 2. Setup tự động (One-click Setup)

Lệnh này sẽ:

1.  Tự động tạo file `.env` cho tất cả services.
2.  Tự động cấu hình Keycloak (Inject Google Secret & Client Secret).
3.  Kéo Docker Images và khởi động Containers (Keycloak, Kafka, Postgres).
4.  Nạp dữ liệu mẫu vào Database (Postgres) và Keycloak (Users/Realm).
5.  Đồng bộ Prisma Schema.

```bash
pnpm setup:all
```

_Lưu ý: Quá trình này có thể mất 3-5 phút trong lần chạy đầu tiên để pull Docker images._

### 3. Truy cập ứng dụng

Sau khi setup thành công, các dịch vụ sẽ chạy tại:

| Service                     | URL                                            | Credentials (User/Pass)    |
| :-------------------------- | :--------------------------------------------- | :------------------------- |
| **Client App** (Storefront) | [http://localhost:3000](http://localhost:3000) | User thường / Google Login |
| **Admin Dashboard**         | [http://localhost:3001](http://localhost:3001) | Admin User                 |
| **Keycloak Console**        | [http://localhost:8080](http://localhost:8080) | `admin` / `admin`          |
| **Kafka UI**                | [http://localhost:8090](http://localhost:8090) | -                          |
| **Product Service**         | [http://localhost:8000](http://localhost:8000) | -                          |
| **Order Service**           | [http://localhost:8001](http://localhost:8001) | -                          |
| **Payment Service**         | [http://localhost:8002](http://localhost:8002) | -                          |

---

## 🐛 Troubleshooting (Sửa lỗi thường gặp)

### 1. Lỗi "Database locked" hoặc Keycloak không khởi động

Nếu bạn gặp lỗi liên quan đến DB hoặc Port bị chiếm dụng, hãy chạy lệnh sau để **dọn dẹp sạch sẽ** và cài lại từ đầu:

**Windows (PowerShell Admin):**

```powershell
docker rm -f $(docker ps -aq); docker system prune -a --volumes -f
pnpm setup:all
```

**Mac/Linux:**

```bash
docker rm -f $(docker ps -aq) && docker system prune -a --volumes -f
pnpm setup:all
```

### 2. Cập nhật cấu hình Keycloak/User

Nếu bạn thay đổi cấu hình Realm hoặc thêm User mới trên máy mình và muốn đồng bộ cho team:

1.  Export file config mới từ Docker:
    ```bash
    # (Máy Root) Chạy lệnh export ra file JSON
    docker run --rm --entrypoint "" -v "$(pwd)/docker/keycloak:/tmp/export" quay.io/keycloak/keycloak:26.0 /opt/keycloak/bin/kc.sh export --file /tmp/export/realm-export.json --realm NT2205 --users same_file
    ```
2.  Commit file `docker/keycloak/realm-export.json` lên Git.
3.  Teammate chỉ cần pull về và chạy lại `pnpm setup:all`.

---

## 📂 Cấu trúc dự án (Monorepo)

- `apps/client`: Frontend bán hàng (Next.js)
- `apps/admin`: Dashboard quản trị (Next.js)
- `apps/product-service`: Service quản lý sản phẩm (Express)
- `apps/order-service`: Service quản lý đơn hàng (Fastify)
- `apps/payment-service`: Service thanh toán (Hono)
- `packages/`: Các thư viện dùng chung (DB, Kafka, Types, UI Config)
