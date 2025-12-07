import AdminLayout from '../components/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import UserManagement from '../pages/UserManagement';
import ExamManagement from '../pages/ExamManagement';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';

const adminRoutes = {
  path: '/admin',
  element: <ProtectedAdminRoute />,
  children: [
    {
      element: <AdminLayout />,
      children: [
        {
          index: true,
          element: <AdminDashboard />,
        },
        {
          path: 'users',
          element: <UserManagement />,
        },
        {
          path: 'exams',
          element: <ExamManagement />,
        },
        {
          path: 'analytics',
          element: <div><h1>Analytics (Coming Soon)</h1></div>,
        },
        {
          path: 'settings',
          element: <div><h1>Settings (Coming Soon)</h1></div>,
        },
      ],
    },
  ],
};

export default adminRoutes;
