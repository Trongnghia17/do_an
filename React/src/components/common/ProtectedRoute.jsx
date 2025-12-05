import { Navigate } from 'react-router-dom';
import useAuth from '@/features/auth/store/auth.store';

export default function ProtectedRoute({ children }) {
  const { token, user , initialized } = useAuth.getState();
  if (!initialized) return null; 
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}
