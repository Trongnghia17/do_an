import { useEffect } from 'react';
import useAuth from '@/features/user/auth/store/auth.store';

/**
 * Debug component to check auth state
 * Add this to AdminLayout to monitor auth status
 */
const AuthDebug = () => {
  const { token, user } = useAuth();
  
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('userRole');
    
    console.group('🔐 Auth Debug');
    console.log('Zustand token:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('Zustand user:', user);
    console.log('localStorage token:', localToken ? `${localToken.substring(0, 20)}...` : 'null');
    console.log('localStorage role:', localUser);
    console.groupEnd();
  }, [token, user]);
  
  return null; // This component doesn't render anything
};

export default AuthDebug;
