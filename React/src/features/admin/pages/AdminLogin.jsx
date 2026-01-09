import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import fastapiService from '@/services/fastapi.service';
import useAuth from '@/features/user/auth/store/auth.store';
import logo from "@/assets/images/logo.png";
import emailimg from "@/assets/images/email.svg";
import passwordimg from "@/assets/images/password.svg";
import eye from "@/assets/images/eye.svg";
import eyeSlash from "@/assets/images/eye-slash.svg";
import './AdminLogin.css';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Call FastAPI login endpoint
      const response = await fastapiService.auth.login({
        email: email,
        password: password
      });
      
      // Store token and user info
      const { access_token, user } = response.data;
      
      console.log('Login response:', { access_token, user }); // Debug log
      
      // Save to Zustand store (this will also save to localStorage via persist middleware)
      setToken(access_token);
      setUser(user);
      
      // Also save to localStorage for backward compatibility
      localStorage.setItem('token', access_token);
      localStorage.setItem('userRole', user.role || 'user');
      localStorage.setItem('userName', user.name || user.email);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userId', user.id);
      
      console.log('Token saved:', access_token); // Debug log
      
      toast.success('Đăng nhập thành công!');
      
      // Check if user is admin or super_admin to navigate to admin panel
      if (user.role === 'admin' || user.role === 'super_admin') {
        // Small delay to ensure token is persisted
        setTimeout(() => {
          navigate('/admin');
        }, 100);
      } else {
        toast.warning('Bạn không có quyền truy cập trang Admin');
        setToken(null);
        setUser(null);
        localStorage.clear();
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-imgleftmain">
      </div>
      <div className="admin-login-cardmain">
        <div className='admin-login-card'>
          <div className='admin-logo-div'>
            <img className='admin-logo' src={logo} alt="logo-owl-english" />
          </div>
          <h2 className='admin-title-login'>Đăng nhập Admin</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
            <div className='admin-login-input-container'>
              <input
                className="admin-login-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <img className='key-logo-input' src={emailimg} alt="email-img" />
            </div>
            <div className='admin-login-input-container'>
              <input
                className="admin-login-input"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <img className='key-logo-input' src={passwordimg} alt="password-img" />
              <img
                src={showPassword ? eyeSlash : eye}
                alt="toggle-password"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              />
            </div>
            <button 
              className="admin-login-primaryBtn" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className='admin-login-option'>
            <div className='admin-login-remember'>
              <input type="checkbox" />
              <p className='admin-save-password-text'>Lưu mật khẩu</p>
            </div>
            <div className='admin-login-forgot'>
              <a href="">Quên mật khẩu?</a>
            </div>
          </div>

          <div className='admin-demo-accounts'>
            <div className='admin-demo-accounts-title'>🔐 Tài khoản Demo:</div>
            <div className='admin-demo-account'>
              <strong>Admin:</strong><br />
              Email: admin@owlenglish.com<br />
              Password: admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
