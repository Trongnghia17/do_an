import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminRoute = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole'); // Assuming role is stored

  if (!token) {
    // Not logged in, redirect to admin login
    return <Navigate to="/admin/login" replace />;
  }

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    // Not an admin, show access denied or redirect to home
    return <Navigate to="/" replace />;
  }

  // Authorized, render the admin routes
  return <Outlet />;
};

export default ProtectedAdminRoute;
