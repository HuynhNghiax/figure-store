# FigHub — Figure Store

Full-stack cửa hàng mô hình: **React + Vite**, **Spring Boot + JWT**, **PostgreSQL**, **PayPal**, **Google OAuth**.

## Tính năng

- Đăng ký / đăng nhập + OTP email + quên mật khẩu
- Đăng nhập Google (OAuth 2.0)
- JWT + Spring Security (không còn header `X-User-Role` giả mạo)
- Sản phẩm phân trang API, upload ảnh, soft delete
- Giỏ hàng kiểm tra tồn kho
- Đặt hàng COD hoặc PayPal
- Review gắn `userId` (bắt buộc đăng nhập)
- Admin dashboard, quản lý đơn / SP / user
- Docker Compose + GitHub Actions CI

---

## Chạy local (development)

### 1. PostgreSQL
```sql
CREATE DATABASE figure_store;
```

### 2. Biến môi trường (PowerShell)
```powershell
$env:DB_PASSWORD="mật_khẩu_postgres"
$env:JWT_SECRET="chuoi-bi-mat-jwt-it-nhat-32-ky-tu"
$env:MAIL_USERNAME="email@gmail.com"
$env:MAIL_APP_PASSWORD="gmail_app_password"
$env:GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
$env:PAYPAL_CLIENT_ID="your_paypal_client_id"
$env:PAYPAL_CLIENT_SECRET="your_paypal_secret"
```

Xem đầy đủ: `backend/application-local.properties.example`

### 3. Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
→ http://localhost:8080

### 4. Frontend
```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```
→ http://localhost:5173

### Tạo Admin
Sau khi đăng ký, trong PostgreSQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'ten_cua_ban';
```

---

## Docker
```bash
# Tạo file .env ở root (tùy chọn) với DB_PASSWORD, JWT_SECRET, ...
docker compose up --build
```
- Frontend: http://localhost:5173  
- Backend: http://localhost:8080  
- Postgres: localhost:5432  

---

## Cấu hình Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials  
2. Tạo **OAuth 2.0 Client ID** (Web)  
3. Authorized JavaScript origins: `http://localhost:5173`  
4. Copy Client ID vào:
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`
   - Backend env → `GOOGLE_CLIENT_ID`

---

## PayPal Sandbox

1. Đăng ký tại https://developer.paypal.com/dashboard/  
2. Tạo **REST API apps** → lấy `Client ID` và `Secret`  
3. Cấu hình trong `application.properties`:
   ```
   paypal.client-id=<your_client_id>
   paypal.client-secret=<your_secret>
   paypal.mode=sandbox
   ```
4. Checkout → chọn **PayPal** → redirect cổng thanh toán PayPal  

Callback URL: `http://localhost:8080/api/payments/paypal-return`

---

## API chính

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/google` | Public |
| GET | `/api/products?page&size&search&brand` | Public |
| POST | `/api/orders` | Public (khách) / JWT (user) |
| POST | `/api/reviews` | JWT required |
| GET/POST | `/api/products/admin`, upload, ... | ADMIN JWT |

Gửi token: `Authorization: Bearer <jwt>`

---

## CI

GitHub Actions (`.github/workflows/ci.yml`): build + test backend, lint + build frontend.

---

## Cấu trúc

```
figure-store/
├── backend/          Spring Boot API
├── frontend/         React + Vite
├── uploads/          Ảnh sản phẩm
├── docker-compose.yml
└── .github/workflows/