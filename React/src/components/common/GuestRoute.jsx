import { Navigate } from 'react-router-dom';
import useAuth from '@/features/auth/store/auth.store';

export default function GuestRoute({ children }) {
  const { token, user, initialized } = useAuth();
  if (!initialized) return null; // hoặc spinner

  // ĐÃ đăng nhập -> đẩy về Trang chủ "/"
  if (token && user) return <Navigate to="/" replace />;

  // CHƯA đăng nhập -> cho vào /login như bình thường
  return children;
}
