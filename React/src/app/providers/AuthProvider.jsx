import { useEffect } from 'react';
import useAuth from '@/features/user/auth/store/auth.store';
import { getMe } from '@/features/user/api/users.api';

export default function AuthProvider({ children }) {
  const { setUser, token , setInitialized } = useAuth();

  useEffect(() => {
    (async () => {
      if (!token) { setUser(null); return; }
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setInitialized(true); // 👈 rất quan trọng
      }
    })();
  }, [token, setUser]);

  return children;
}
