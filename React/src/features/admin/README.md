# Admin Panel - OwlEnglish Backend UI

Admin Panel được xây dựng với React + Ant Design để quản lý toàn bộ hệ thống OwlEnglish.

## 📂 Cấu trúc thư mục

```
src/features/admin/
├── components/
│   ├── AdminLayout.jsx          # Layout chính với sidebar & header
│   ├── AdminLayout.css
│   └── ProtectedAdminRoute.jsx  # Route protection
├── pages/
│   ├── AdminDashboard.jsx       # Dashboard với statistics
│   ├── UserManagement.jsx       # CRUD Users
│   ├── ExamManagement.jsx       # CRUD Exams
│   └── RoleManagement.jsx       # Role & Permission management
├── services/
│   └── adminService.js          # API client cho admin endpoints
├── hooks/
│   └── (custom hooks for admin)
└── routes.jsx                   # Admin routes configuration
```

## 🎨 Features

### 1. Dashboard
- **Statistics Cards**: Tổng users, exams, revenue, growth rate
- **Recent Users Table**: Danh sách users mới nhất
- **System Status**: Database, API Server, Storage, Memory usage
- **Charts**: User growth, revenue trends (coming soon)

### 2. User Management
- ✅ **List Users**: Pagination, search, filter by role/status
- ✅ **Create User**: Form với validation
- ✅ **Edit User**: Update user info, role, status
- ✅ **Delete User**: Soft delete với confirmation
- ✅ **Toggle Status**: Active/Inactive users

### 3. Exam Management
- ✅ **List Exams**: Filter by type, level, status
- ✅ **Create Exam**: Full form với type, level, duration, questions
- ✅ **Edit Exam**: Update exam details
- ✅ **Delete Exam**: Remove exams với confirmation
- ✅ **Manage Questions**: Link to question management (coming soon)

### 4. Role & Permission Management
- ✅ **List Roles**: View all roles với permissions
- ✅ **Create Role**: Define new roles với custom permissions
- ✅ **Edit Role**: Update role permissions
- ✅ **Delete Role**: Remove roles (protected for super_admin)
- ✅ **Permission Groups**: Organized by modules (users, exams, roles)

### 5. Analytics (Coming Soon)
- User growth charts
- Exam completion rates
- Revenue analytics
- Active users tracking

### 6. Settings (Coming Soon)
- System configuration
- Email settings
- AI service settings
- Application settings

## 🚀 Setup & Integration

### 1. Cập nhật App.jsx

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import adminRoutes from './features/admin/routes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin routes */}
        <Route path={adminRoutes.path} element={adminRoutes.element}>
          {adminRoutes.children.map((route, index) => (
            <Route key={index} {...route} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục React:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Backend API Endpoints Required

Admin panel cần các endpoints sau từ FastAPI:

```
GET    /api/v1/admin/dashboard/stats
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
PATCH  /api/v1/admin/users/{id}/status

GET    /api/v1/admin/exams
POST   /api/v1/admin/exams
PUT    /api/v1/admin/exams/{id}
DELETE /api/v1/admin/exams/{id}

GET    /api/v1/admin/roles
POST   /api/v1/admin/roles
PUT    /api/v1/admin/roles/{id}
DELETE /api/v1/admin/roles/{id}
GET    /api/v1/admin/permissions
```

## 🔒 Authentication & Authorization

### Protected Routes
Admin routes được bảo vệ bởi `ProtectedAdminRoute`:
- Kiểm tra token trong localStorage
- Kiểm tra role (admin hoặc super_admin)
- Redirect về login nếu unauthorized

### API Authorization
Tất cả requests tự động thêm Bearer token:
```javascript
Authorization: Bearer <token>
```

### Role-based Access
- **super_admin**: Full access to all features
- **admin**: Limited access (cannot delete super_admin roles)
- **user**: No access to admin panel

## 🎯 Usage

### Accessing Admin Panel

1. **Login** với admin account
2. Navigate to `/admin`
3. Sidebar menu:
   - Dashboard: `/admin`
   - Users: `/admin/users`
   - Exams: `/admin/exams`
   - Roles: `/admin/roles`
   - Analytics: `/admin/analytics`
   - Settings: `/admin/settings`

### API Integration

Tất cả pages đã có placeholders cho API calls:

```javascript
// Example: User Management
const fetchUsers = async () => {
  try {
    const response = await adminService.getUsers();
    setUsers(response.data);
  } catch (error) {
    message.error('Failed to fetch users');
  }
};
```

Chỉ cần thay thế mock data bằng actual API calls.

## 🛠️ Development

### Running the Admin Panel

```bash
cd React
npm run dev
```

Access at: `http://localhost:5173/admin`

### Testing Admin Features

1. Sử dụng mock data (đã có sẵn)
2. Test UI/UX flow
3. Khi backend ready, update API calls trong adminService.js

## 📦 Dependencies

Admin panel sử dụng:
- **React 19**: UI framework
- **Ant Design 5**: UI component library
- **React Router DOM 7**: Routing
- **Axios**: HTTP client
- **@ant-design/icons**: Icon library

Tất cả đã được cài đặt trong package.json.

## 🎨 Customization

### Styling
- Global styles: `AdminLayout.css`
- Ant Design theme: Có thể custom trong App.jsx với ConfigProvider
- Component styles: Inline styles hoặc CSS modules

### Adding New Pages
1. Tạo component trong `pages/`
2. Thêm route vào `routes.jsx`
3. Thêm menu item trong `AdminLayout.jsx`
4. Thêm API endpoints trong `adminService.js`

### Example: Adding Analytics Page

```jsx
// pages/Analytics.jsx
const Analytics = () => {
  // Your analytics implementation
};

// routes.jsx
{
  path: 'analytics',
  element: <Analytics />,
}

// AdminLayout.jsx - menuItems
{
  key: '/admin/analytics',
  icon: <BarChartOutlined />,
  label: 'Analytics',
}
```

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check token in localStorage
2. **CORS errors**: Configure CORS in FastAPI backend
3. **API not found**: Verify VITE_API_URL in .env

### Debug Mode

Enable console logs:
```javascript
// In adminService.js
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config);
  return config;
});
```

## 📝 TODO

- [ ] Implement actual API integration
- [ ] Add Analytics page với charts
- [ ] Add Settings page
- [ ] Add Question Management for exams
- [ ] Add file upload UI
- [ ] Add export/import features
- [ ] Add notification system
- [ ] Add activity logs
- [ ] Add real-time updates với WebSocket

## 🤝 Contributing

Khi thêm features mới:
1. Follow existing code structure
2. Use Ant Design components
3. Add error handling
4. Update this README

---

**Made with ❤️ for OwlEnglish Backend Management**
