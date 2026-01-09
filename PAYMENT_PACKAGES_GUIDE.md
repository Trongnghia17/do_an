# Hệ thống Quản lý Gói Nạp Trứng Cú (Payment Packages)

## Tổng quan
Hệ thống cho phép admin quản lý các gói nạp Trứng Cú một cách linh hoạt thay vì fix cứng trong code.

## Các thành phần đã triển khai

### Backend (FastAPI)

#### 1. Model Database
**File:** `FastAPI-Service/app/models/payment_models.py`

```python
class PaymentPackage(Base):
    id: int
    amount: int              # Số tiền VNĐ
    owl_amount: int          # Số Trứng Cú cơ bản
    bonus_owl: int           # Số Trứng Cú bonus
    label: str               # Nhãn hiển thị (vd: "10,000đ")
    description: str         # Mô tả gói
    is_active: bool          # Hiển thị hay không
    display_order: int       # Thứ tự hiển thị
    created_at: datetime
    updated_at: datetime
```

#### 2. Migration
**File:** `FastAPI-Service/alembic/versions/122454124bd7_create_payment_packages_table.py`

Migration đã tạo bảng `payment_packages` và insert 6 gói mặc định:
- 10,000đ = 100 🥚
- 50,000đ = 500 🥚  
- 100,000đ = 1,000 🥚 + 100 bonus
- 200,000đ = 2,000 🥚 + 200 bonus
- 500,000đ = 5,000 🥚 + 500 bonus
- 1,000,000đ = 10,000 🥚 + 1,500 bonus

#### 3. API Endpoints

##### Admin Endpoints (Yêu cầu role_id = 1)
**File:** `FastAPI-Service/app/api/v1/endpoints/admin_payment_packages.py`

```
GET    /admin/payment-packages              # Lấy danh sách gói (admin)
GET    /admin/payment-packages/{id}         # Chi tiết gói
POST   /admin/payment-packages              # Tạo gói mới
PUT    /admin/payment-packages/{id}         # Cập nhật gói
DELETE /admin/payment-packages/{id}         # Xóa gói
```

**Query Parameters:**
- `include_inactive=true`: Hiển thị cả gói đã tắt

**Request Body (Create/Update):**
```json
{
  "amount": 10000,
  "owl_amount": 100,
  "bonus_owl": 0,
  "label": "10,000đ",
  "description": "Gói cơ bản",
  "is_active": true,
  "display_order": 1
}
```

##### Public Endpoint
**File:** `FastAPI-Service/app/api/v1/endpoints/payments.py`

```
GET /payments/payment-packages    # Lấy gói active cho user
```

**Response:**
```json
[
  {
    "amount": 10000,
    "owl": 100,
    "label": "10,000đ",
    "bonus": 0
  }
]
```

#### 4. Cập nhật Create Payment
Payment endpoint đã được cập nhật để:
- Kiểm tra gói nạp có tồn tại và active không
- Tính tổng OWL = owl_amount + bonus_owl từ package
- Validate với database thay vì hardcode

### Frontend (React)

#### 1. Admin Management Page
**File:** `React/src/features/admin/pages/PaymentPackageManagement.jsx`

Trang quản lý với các tính năng:
- ✅ Hiển thị danh sách gói dạng table
- ✅ Thêm gói mới
- ✅ Chỉnh sửa gói
- ✅ Xóa gói (có confirm)
- ✅ Bật/tắt gói
- ✅ Sắp xếp theo thứ tự hiển thị
- ✅ Format tiền tệ VNĐ

#### 2. Admin Route
**File:** `React/src/features/admin/routes.jsx`

Route đã được thêm:
```jsx
{
  path: 'payment-packages',
  element: <PaymentPackageManagement />,
}
```

#### 3. Admin Menu
**File:** `React/src/features/admin/components/AdminLayout.jsx`

Menu item mới:
```jsx
{
  key: '/admin/payment-packages',
  icon: <DollarOutlined />,
  label: 'Quản lý gói nạp',
}
```

#### 4. Payment Modal (User)
**File:** `React/src/features/user/profile/PaymentModal.jsx`

Modal vẫn hoạt động như cũ nhưng giờ lấy packages từ API thay vì hardcode.

## Cách sử dụng

### Cho Admin

1. **Truy cập trang quản lý:**
   - Đăng nhập với tài khoản admin (role_id = 1)
   - Vào menu: Admin > Quản lý gói nạp
   - URL: `http://localhost:5173/admin/payment-packages`

2. **Thêm gói mới:**
   - Click nút "Thêm gói mới"
   - Điền thông tin:
     - Số tiền (VNĐ): 100,000
     - Số Trứng Cú cơ bản: 1,000
     - Trứng Cú bonus: 100 (optional)
     - Nhãn hiển thị: "100,000đ"
     - Mô tả: "Gói ưu đãi +10%"
     - Thứ tự hiển thị: 3
     - Kích hoạt: Bật
   - Click "OK"

3. **Chỉnh sửa gói:**
   - Click icon Edit ✏️
   - Sửa các trường cần thiết
   - Click "OK"

4. **Xóa gói:**
   - Click icon Delete 🗑️
   - Xác nhận xóa

5. **Bật/tắt gói:**
   - Edit gói và toggle switch "Kích hoạt"
   - Gói tắt sẽ không hiển thị cho user

### Cho User

User không cần làm gì, vẫn sử dụng như cũ:
1. Vào Profile > Nạp Trứng Cú
2. Chọn gói từ danh sách (tự động load từ database)
3. Quét QR và thanh toán

## API Testing

### Test với curl

```bash
# 1. Login admin để lấy token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2. Lấy danh sách gói (dùng token)
curl -X GET "http://localhost:8000/admin/payment-packages" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Tạo gói mới
curl -X POST "http://localhost:8000/admin/payment-packages" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300000,
    "owl_amount": 3000,
    "bonus_owl": 300,
    "label": "300,000đ",
    "description": "Gói hot",
    "is_active": true,
    "display_order": 5
  }'

# 4. Cập nhật gói
curl -X PUT "http://localhost:8000/admin/payment-packages/7" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"bonus_owl": 500}'

# 5. Xóa gói
curl -X DELETE "http://localhost:8000/admin/payment-packages/7" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 6. Lấy gói cho user (public)
curl -X GET "http://localhost:8000/payments/payment-packages"
```

## Database Schema

```sql
CREATE TABLE payment_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    amount INT NOT NULL,
    owl_amount INT NOT NULL,
    bonus_owl INT DEFAULT 0,
    label VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_id (id)
);
```

## Lưu ý quan trọng

1. **Bảo mật:**
   - Chỉ admin (role_id = 1) mới có quyền CRUD packages
   - User chỉ có thể xem gói active

2. **Validation:**
   - Amount > 0
   - Owl_amount > 0
   - Bonus_owl >= 0

3. **Business Logic:**
   - Khi user thanh toán, tổng OWL = owl_amount + bonus_owl
   - Gói is_active=false không hiển thị cho user
   - Thứ tự hiển thị theo display_order, sau đó theo amount

4. **Migration:**
   - Database đã có 6 gói mặc định
   - Có thể edit hoặc xóa các gói này

## Troubleshooting

### Lỗi 403 Forbidden khi truy cập admin endpoints
- Kiểm tra user có role_id = 1 không
- Kiểm tra token có hợp lệ không

### Gói không hiển thị cho user
- Kiểm tra is_active = true
- Kiểm tra database có dữ liệu không

### Frontend không load được packages
- Kiểm tra API endpoint `/payments/payment-packages`
- Mở Network tab trong DevTools
- Kiểm tra console log

## Tính năng có thể mở rộng

1. **Analytics:**
   - Thống kê gói nào được mua nhiều nhất
   - Doanh thu theo gói

2. **Promotion:**
   - Thêm field discount_percent
   - Thêm field valid_from, valid_to

3. **Highlight:**
   - Thêm field is_popular, is_recommended
   - Thêm custom CSS class

4. **Limitation:**
   - Giới hạn số lần mua/ngày
   - Giới hạn theo user level
