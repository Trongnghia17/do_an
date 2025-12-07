import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from '@/features/user/auth/store/auth.store';

const ProtectedAdminRoute = () => {
  const { token: zustandToken, user, setToken, setUser } = useAuth();
  
  // Sync localStorage with Zustand on mount
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    const localUserRole = localStorage.getItem('userRole');
    const localUserId = localStorage.getItem('userId');
    const localUserEmail = localStorage.getItem('userEmail');
    const localUserName = localStorage.getItem('userName');
    
    // If localStorage has token but Zustand doesn't, sync them
    if (localToken && !zustandToken) {
      console.log('Syncing token from localStorage to Zustand');
      setToken(localToken);
      
      if (!user && localUserId) {
        setUser({
          id: parseInt(localUserId),
          email: localUserEmail,
          name: localUserName,
          role: localUserRole,
        });
      }
    }
  }, [zustandToken, user, setToken, setUser]);
  
  const token = zustandToken || localStorage.getItem('token');
  const userRole = user?.role || localStorage.getItem('userRole');

  if (!token) {
    // Not logged in, redirect to admin login
    console.warn('No token found, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    // Not an admin, show access denied or redirect to home
    console.warn('User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Authorized, render the admin routes
  return <Outlet />;
};

export default ProtectedAdminRoute;
