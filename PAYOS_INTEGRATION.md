# PayOS Payment Integration - OwlEnglish

## Tổng quan
Tích hợp PayOS để nạp Trứng Cú (OWL tokens) vào hệ thống OwlEnglish.

## Cấu hình

### 1. Backend (FastAPI)

#### Cài đặt
```bash
cd FastAPI-Service
poetry install
```

#### Cấu hình `.env`
```env
# PayOS Configuration
PAYOS_CLIENT_ID=aa88486b-6d07-41a9-8576-3d90630c1777
PAYOS_API_KEY=648f2079-afcc-4939-94a0-5c0ba499e6a0
PAYOS_CHECKSUM_KEY=5054d16920ccae59579539165934343c3b1acc310e933f7da0f1ec5e3c6068a6
PAYOS_RETURN_URL=http://localhost:5173/lich-su-thanh-toan
PAYOS_CANCEL_URL=http://localhost:5173/lich-su-thanh-toan
```

#### Chạy migration
```bash
poetry run alembic upgrade head
```

#### Start server
```bash
poetry run python run.py
```

### 2. Frontend (React)

#### Cài đặt
```bash
cd React
npm install
```

#### Start development server
```bash
npm run dev
```

## Luồng thanh toán

### 1. Người dùng chọn gói nạp
- Vào trang "Lịch sử thanh toán"
- Click nút "Nạp OWL"
- Chọn gói nạp (10k, 50k, 100k, 200k, 500k, 1tr VNĐ)

### 2. Tạo link thanh toán
- Frontend gọi API `POST /payments/create`
- Backend tạo:
  - Payment record trong database
  - Link thanh toán qua PayOS API
- Trả về QR code và link thanh toán

### 3. Thanh toán
- Người dùng quét QR code bằng app ngân hàng
- Hoặc mở link thanh toán trên mobile

### 4. Xác nhận thanh toán
**Cách 1: Auto-check (Frontend)**
- Frontend tự động check status mỗi 3 giây
- Gọi API `GET /payments/check/{order_code}`

**Cách 2: Webhook (Backend)**
- PayOS gửi webhook về `POST /payments/webhook`
- Backend tự động cập nhật:
  - Payment status = PAID
  - Wallet balance tăng thêm OWL

### 5. Hoàn tất
- Số Trứng Cú được cộng vào ví user
- Hiển thị thông báo thành công

## API Endpoints

### Payments

#### 1. Tạo thanh toán
```http
POST /payments/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100000
}
```

**Response:**
```json
{
  "id": 1,
  "order_code": "17361234567891234",
  "amount": 100000,
  "owl_amount": 1000,
  "description": "Nap 1000 OWL",
  "status": "PENDING",
  "payment_url": "https://pay.payos.vn/web/...",
  "qr_code": "00020101021238570010A...",
  "created_at": "2026-01-10T00:00:00"
}
```

#### 2. Kiểm tra trạng thái
```http
GET /payments/check/{order_code}
Authorization: Bearer {token}
```

**Response (đã thanh toán):**
```json
{
  "status": "PAID",
  "message": "Thanh toán thành công! Bạn đã nhận 1000 Trứng Cú",
  "owl_amount": 1000,
  "new_balance": 1000
}
```

#### 3. Lịch sử thanh toán
```http
GET /payments/history
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "17361234567891234",
    "time": "14:30 · 10/01/2026",
    "eggs": 1000,
    "note": "Nạp 1000 Trứng Cú",
    "status": "done"
  }
]
```

#### 4. Thông tin ví
```http
GET /payments/wallet
Authorization: Bearer {token}
```

**Response:**
```json
{
  "balance": 1000,
  "total_deposited": 1000,
  "total_spent": 0
}
```

#### 5. Webhook (PayOS callback)
```http
POST /payments/webhook
Content-Type: application/json

{
  "code": "00",
  "desc": "success",
  "success": true,
  "data": {
    "orderCode": 123,
    "amount": 100000,
    "description": "Nap 1000 OWL",
    "reference": "FT23020421232323",
    "transactionDateTime": "2026-01-10 14:30:00",
    ...
  },
  "signature": "..."
}
```

#### 6. Danh sách gói nạp
```http
GET /payments/payment-packages
```

**Response:**
```json
[
  {
    "amount": 10000,
    "owl": 100,
    "label": "10,000đ",
    "bonus": 0
  },
  {
    "amount": 100000,
    "owl": 1000,
    "label": "100,000đ",
    "bonus": 100
  },
  ...
]
```

## Database Schema

### `user_wallets`
```sql
CREATE TABLE user_wallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  balance INT DEFAULT 0,
  total_deposited INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### `payments`
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_code VARCHAR(100) NOT NULL UNIQUE,
  amount INT NOT NULL,
  owl_amount INT NOT NULL,
  description VARCHAR(500),
  status ENUM('PENDING', 'PAID', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  payos_data JSON,
  paid_at DATETIME,
  cancelled_at DATETIME,
  expired_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (order_code),
  INDEX (status)
);
```

## Lưu ý quan trọng

### PayOS API Constraints
1. **Description max 25 ký tự** (cho tài khoản không liên kết)
2. **expiredAt phải > hiện tại**
3. **Signature** phải được tạo theo thứ tự alphabet
4. **orderCode** phải là số integer duy nhất

### Tỉ giá
- **1 Trứng Cú = 100 VNĐ**
- VD: Nạp 100,000đ = 1,000 Trứng Cú

### Webhook
- PayOS chỉ gửi webhook khi thanh toán **thành công**
- Phải trả về status code 2XX để xác nhận
- Nên có auto-check ở frontend để UX tốt hơn

### Testing
1. Sử dụng tài khoản PayOS test
2. Test với số tiền nhỏ (10,000đ)
3. Kiểm tra webhook URL có public không (dùng ngrok nếu local)

## Troubleshooting

### Lỗi "description: Mô tả tối đa 25 kí tự"
- Rút ngắn description trong `payos_service.py`
- VD: "Nap 1000 OWL" thay vì "Nap 1000 Trung Cu - OwlEnglish"

### Lỗi "expired_at can not before now"
- Dùng `time.time()` thay vì `datetime.utcnow().timestamp()`
- Đảm bảo server time đúng

### Webhook không được gọi
- Kiểm tra webhook URL đã đăng ký trên PayOS
- URL phải public (không phải localhost)
- Dùng ngrok cho development:
  ```bash
  ngrok http 8000
  # Đăng ký: https://xxx.ngrok.io/payments/webhook
  ```

### QR code không hiện
- Kiểm tra `paymentData.qr_code` có dữ liệu không
- Fallback sang `paymentData.payment_url`

## Contact & Support
- PayOS Support: support@payos.vn
- Docs: https://payos.vn/docs/
