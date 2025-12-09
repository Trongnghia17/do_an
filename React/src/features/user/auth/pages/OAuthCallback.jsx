import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '@/features/user/auth/store/auth.store';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = () => {
      // Get parameters from URL
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      
      if (error) {
        let errorMessage = 'Đăng nhập thất bại';
        if (error === 'oauth_failed') {
          errorMessage = 'Xác thực với Google thất bại';
        } else if (error === 'no_email') {
          errorMessage = 'Không thể lấy email từ tài khoản Google';
        } else if (error === 'oauth_error') {
          errorMessage = 'Có lỗi xảy ra khi đăng nhập với Google';
        }
        
        toast.error(errorMessage);
        navigate('/login');
        return;
      }
      
      if (token) {
        const userId = searchParams.get('user_id');
        const userName = searchParams.get('user_name');
        const userEmail = searchParams.get('user_email');
        const roleId = searchParams.get('role_id');
        const role = searchParams.get('role');
        
        // Create user object
        const user = {
          id: parseInt(userId),
          name: userName,
          email: userEmail,
          role_id: roleId ? parseInt(roleId) : null,
          role: role || null,
          is_active: true
        };
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update auth store
        setToken(token);
        setUser(user);
        
        // Check if this is a new OAuth user (check from URL param)
        const isNewUser = searchParams.get('is_new_user') === 'true';
        
        if (isNewUser && roleId !== '1') {
          // New OAuth user (not admin) - suggest setting password
          toast.success('Đăng nhập thành công! Bạn có thể thiết lập mật khẩu để đăng nhập bằng email.');
          setTimeout(() => {
            // Show option to set password (redirect after 2s)
            navigate('/set-password');
          }, 2000);
        } else {
          toast.success('Đăng nhập thành công!');
          
          // Navigate based on role
          if (roleId === '1') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }
      } else {
        toast.error('Không nhận được thông tin đăng nhập');
        navigate('/login');
      }
    };
    
    handleOAuthCallback();
  }, [searchParams, navigate, setToken, setUser]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div style={{ fontSize: '18px', color: '#6B7280', marginBottom: '16px' }}>
        Đang xử lý đăng nhập...
      </div>
    </div>
  );
}
