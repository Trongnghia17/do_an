# Hướng dẫn khắc phục lỗi "No data" trong Lịch sử nạp Trứng Cú

## Vấn đề
Trang "Lịch sử nạp Trứng Cú" trong Admin hiển thị "No data" mặc dù có thống kê.

## Nguyên nhân có thể

### 1. Chưa có dữ liệu thanh toán trong database
**Triệu chứng:** Tất cả thống kê đều = 0

**Cách kiểm tra:**
```bash
cd FastAPI-Service
python check_payment_data.py
```

**Cách khắc phục:**
```bash
# Tạo dữ liệu mẫu
python create_sample_payments.py
```

### 2. Lỗi xác thực Admin
**Triệu chứng:** Console hiển thị lỗi 403 Forbidden

**Cách kiểm tra:**
- Mở DevTools (F12) → Tab Console
- Mở Tab Network → Reload trang
- Xem API call `/admin/payments/history` → Nếu 403, tài khoản không phải admin

**Cách khắc phục:**
```bash
# Kiểm tra role_id của user hiện tại
# role_id = 1 là admin
```

### 3. Backend chưa chạy hoặc lỗi
**Triệu chứng:** Console hiển thị lỗi network hoặc 500

**Cách kiểm tra:**
```bash
# Kiểm tra backend đang chạy
curl http://localhost:8000/api/v1/admin/payments/statistics

# Kiểm tra logs
cd FastAPI-Service
# Xem terminal đang chạy uvicorn
```

**Cách khắc phục:**
```bash
# Khởi động lại backend
cd FastAPI-Service
uvicorn app.main:app --reload
```

### 4. Lỗi CORS
**Triệu chứng:** Console hiển thị lỗi CORS

**Cách khắc phục:** Kiểm tra file `FastAPI-Service/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Cách debug chi tiết

### 1. Kiểm tra Console
```
F12 → Console tab
```
Xem các log:
- "Fetching payments with params: ..."
- "Payments response: ..."
- Nếu có lỗi màu đỏ → copy và tìm hiểu

### 2. Kiểm tra Network
```
F12 → Network tab → XHR filter
```
- Tìm request `history` và `statistics`
- Click vào → Tab Preview xem response
- Tab Headers xem status code

### 3. Kiểm tra Backend Logs
```bash
# Terminal đang chạy backend sẽ hiển thị:
INFO: Admin admin@example.com requesting payment history
INFO: Total payments in database: 0
```

## Test API trực tiếp

### Test với curl:
```bash
# 1. Login để lấy token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# 2. Test API statistics (thay YOUR_TOKEN)
curl http://localhost:8000/api/v1/admin/payments/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test API history
curl http://localhost:8000/api/v1/admin/payments/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test với Swagger UI:
1. Mở: http://localhost:8000/docs
2. Click "Authorize" → Nhập token
3. Test endpoint `/admin/payments/history`

## Checklist khắc phục nhanh

- [ ] Backend đang chạy (uvicorn)
- [ ] Frontend đang chạy (vite)
- [ ] Đã login với tài khoản admin (role_id = 1)
- [ ] Có dữ liệu payment trong database
- [ ] Không có lỗi màu đỏ trong Console
- [ ] API response status = 200

## Liên hệ

Nếu vẫn gặp lỗi, gửi thông tin sau:
1. Screenshot Console (F12)
2. Screenshot Network tab
3. Backend logs (terminal output)
