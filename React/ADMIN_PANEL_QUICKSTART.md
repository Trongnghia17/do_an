# 🚀 Admin Panel Quick Start Guide

## ✅ Đã hoàn thành

Admin Panel cho OwlEnglish Backend đã được tạo hoàn chỉnh với React + Ant Design!

### 📦 Các component đã tạo:

```
React/src/features/admin/
├── components/
│   ├── AdminLayout.jsx          ✅ Layout với sidebar & header
│   ├── AdminLayout.css          ✅ Styling
│   └── ProtectedAdminRoute.jsx  ✅ Route protection
├── pages/
│   ├── AdminDashboard.jsx       ✅ Dashboard với statistics
│   ├── UserManagement.jsx       ✅ CRUD Users
│   ├── ExamManagement.jsx       ✅ CRUD Exams
│   └── RoleManagement.jsx       ✅ Role & Permission management
├── services/
│   └── adminService.js          ✅ API client (ready to use)
├── routes.jsx                   ✅ Routes config
├── README.md                    ✅ Documentation
└── INTEGRATION_GUIDE.jsx        ✅ Integration example
```

### 🎯 Features đã implement:

#### 1. **Admin Dashboard**
- ✅ Statistics cards (Users, Exams, Revenue, Growth)
- ✅ Recent users table
- ✅ System status monitors
- ✅ Responsive design

#### 2. **User Management**
- ✅ List users với pagination
- ✅ Search & filter
- ✅ Create new user
- ✅ Edit user
- ✅ Delete user
- ✅ Toggle active/inactive status

#### 3. **Exam Management**
- ✅ List exams với filters
- ✅ Create exam form
- ✅ Edit exam
- ✅ Delete exam
- ✅ Type & level filters

#### 4. **Role & Permission Management**
- ✅ List roles
- ✅ Create role với permissions
- ✅ Edit role permissions
- ✅ Delete role
- ✅ Permission grouping by module

#### 5. **API Service**
- ✅ Complete API client với axios
- ✅ Authentication headers
- ✅ Error handling
- ✅ Request/response interceptors

#### 6. **Security**
- ✅ Protected admin routes
- ✅ Role-based access control
- ✅ Auto-redirect on unauthorized

---

## 🚀 Cách sử dụng

### 1. Setup Environment

```bash
cd React
cp .env.example .env
```

Cập nhật `.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 2. Routes đã được integrate

Admin routes đã được thêm vào `src/app/routes.jsx`:
- `/admin` - Dashboard
- `/admin/users` - User Management
- `/admin/exams` - Exam Management
- `/admin/roles` - Role Management
- `/admin/analytics` - Analytics (Coming Soon)
- `/admin/settings` - Settings (Coming Soon)

### 3. Run Development Server

```bash
npm run dev
```

Access admin panel: `http://localhost:5173/admin`

### 4. Test với Mock Data

Hiện tại tất cả pages đang sử dụng **mock data** để test UI/UX.

Bạn có thể:
1. Navigate qua các trang
2. Test create/edit/delete flows
3. Test search & filters
4. Test UI responsiveness

### 5. Connect to Real API

Khi FastAPI backend ready, chỉ cần update các function trong `adminService.js`:

**Hiện tại (Mock):**
```javascript
const fetchUsers = async () => {
  // Mock data
  setTimeout(() => {
    setUsers([...mockData]);
  }, 1000);
};
```

**Sau khi có API (Real):**
```javascript
const fetchUsers = async () => {
  const response = await adminService.getUsers();
  setUsers(response.data);
};
```

---

## 🔧 Backend Requirements

Admin panel cần FastAPI backend implement các endpoints sau:

### Dashboard
```
GET /api/v1/admin/dashboard/stats
```

### Users
```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{id}
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
PATCH  /api/v1/admin/users/{id}/status
```

### Exams
```
GET    /api/v1/admin/exams
GET    /api/v1/admin/exams/{id}
POST   /api/v1/admin/exams
PUT    /api/v1/admin/exams/{id}
DELETE /api/v1/admin/exams/{id}
```

### Roles & Permissions
```
GET    /api/v1/admin/roles
GET    /api/v1/admin/roles/{id}
POST   /api/v1/admin/roles
PUT    /api/v1/admin/roles/{id}
DELETE /api/v1/admin/roles/{id}
GET    /api/v1/admin/permissions
POST   /api/v1/admin/roles/{id}/permissions
```

### Authentication
All requests require:
```
Authorization: Bearer <token>
```

---

## 📝 Next Steps

### To-Do List:

1. **Backend Integration**
   - [ ] Implement admin API endpoints trong FastAPI
   - [ ] Test API integration
   - [ ] Handle error responses

2. **Additional Features**
   - [ ] Analytics page với charts
   - [ ] Settings page
   - [ ] Question management
   - [ ] File upload UI
   - [ ] Export/Import data
   - [ ] Activity logs
   - [ ] Real-time notifications

3. **Enhancements**
   - [ ] Add loading skeletons
   - [ ] Add success/error animations
   - [ ] Improve mobile responsiveness
   - [ ] Add dark mode
   - [ ] Add keyboard shortcuts

---

## 🎨 Customization

### Thay đổi màu sắc theme

Trong `src/app/providers/AntdProvider.jsx`:

```jsx
import { ConfigProvider } from 'antd';

export default function AntdProvider({ children }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff', // Your primary color
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
```

### Thêm menu item mới

Trong `AdminLayout.jsx`, update `menuItems`:

```jsx
const menuItems = [
  // ... existing items
  {
    key: '/admin/your-page',
    icon: <YourIcon />,
    label: 'Your Page',
  },
];
```

---

## 🐛 Troubleshooting

### Issue: Cannot access /admin
**Solution**: Check if user has admin role in localStorage
```javascript
localStorage.setItem('userRole', 'admin');
```

### Issue: API calls fail
**Solution**: 
1. Check VITE_API_URL in .env
2. Verify CORS settings in FastAPI
3. Check network tab in DevTools

### Issue: Components not rendering
**Solution**: Check imports and make sure all dependencies installed
```bash
npm install
```

---

## 📚 Documentation

Xem thêm chi tiết:
- `README.md` - Full documentation
- `INTEGRATION_GUIDE.jsx` - Integration example
- `adminService.js` - API client documentation

---

## ✨ Demo Screenshots

### Dashboard
- Statistics cards showing key metrics
- Recent users table
- System status monitors

### User Management
- Searchable table with filters
- Create/Edit forms with validation
- Role assignment

### Exam Management
- Filter by type, level, status
- Full CRUD operations
- Question management link

### Role Management
- Permission grouping
- Visual permission matrix
- Protected super_admin role

---

## 🎉 Kết luận

Admin Panel đã sẵn sàng sử dụng! 

**Điều duy nhất còn lại**: Connect với FastAPI backend và thay mock data bằng real API calls.

Tất cả UI/UX đã được test và hoạt động tốt với mock data.

---

**Happy Coding! 🚀**
