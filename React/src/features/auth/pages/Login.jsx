import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from "react-toastify";
import useAuth from '@/features/auth/store/auth.store';
import api from '@/lib/axios';
import logo from "@/assets/images/logo.png";
import imgleftlogin from "@/assets/images/imgleftlogin.png";
import emailimg from "@/assets/images/email.svg";
import passwordimg from "@/assets/images/password.svg";
import logofacebook from "@/assets/images/facebook.svg";
import logogoogle from "@/assets/images/google.svg";
import nextright from "@/assets/images/nextright.svg";
import eye from "@/assets/images/eye.svg";
import eyeSlash from "@/assets/images/eye-slash.svg";
import { getMe } from '@/features/user/api/users.api';
import '@/features/user/auth/pages/Login.css';

export default function Login() {
  const nav = useNavigate();
  const { setToken, setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const socialRedirect = (provider) => {
    const map = {
      google: `${import.meta.env.VITE_API_BASE_URL}/oauth/google/redirect`,
      facebook: `${import.meta.env.VITE_API_BASE_URL}/oauth/facebook/redirect`,
    };
    window.location.href = map[provider];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login/json", {
        email: email,
        password: password,
      });
      const token = res.data.access_token;
      const user = res.data.user;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success("Đăng nhập thành công");
      nav("/admin/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Đăng nhập thất bại");
    }
  };


  return (
    <div className="login-wrapper">
      <div className="login-imgleftmain">
       
      </div>
      <div className="login-cardmain">
        <div className='login-card'>
          <div className='logo-div'>
            <img className='logo' src={logo} alt="logo-phi-dang" />
          </div>
          <h2 className='title-login'>Đăng nhập</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
            <div className='login-input-container'>
              <input
                className="login-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <img className='key-logo-input' src={emailimg} alt="email-img" />
            </div>
            <div className='login-input-container'>
              <input
                className="login-input"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <img className='key-logo-input' src={passwordimg} alt="passwordimg-img" />
              <img
                src={showPassword ? eyeSlash : eye}
                alt="toggle-password"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              />
            </div>
            <button className="login-primaryBtn" type="submit">Đăng nhập</button>
          </form>

          <div className='login-option'>
            <div className='login-remember'>
              <input type="checkbox" name="" id="" />
              <p className='save-password-text'>Lưu mật khẩu</p>
            </div>
            <div className='login-forgot'>
              <a href="">Quên mật khẩu?</a>
            </div>
          </div>

          <div className='login-register'>
            Bạn chưa có tài khoản? <Link className='login-register-link' to="/register">Tạo tài khoản</Link>
          </div>

          <div className='login-social'>
            <p className='login-social-title'>Hoặc tiếp tục với</p>
            <button className="login-socialBtn" onClick={() => socialRedirect('google')}>
              <div className='login-socialBtn-google'>
                <div className='login-socialBtn-google-content'>
                  <img src={logogoogle} alt="logogoogle" />
                  Đăng nhập với Google
                </div>

                <div className='login-socialBtn-google-icon'>
                  <img src={nextright} alt="nextright" />
                </div>
              </div>
            </button>
            <button className="login-socialBtn" onClick={() => socialRedirect('facebook')}>
              <div className='login-socialBtn-google'>
                <div className='login-socialBtn-google-content'>
                  <img src={logofacebook} alt="logofacebook" />
                  Đăng nhập với Facebook
                </div>

                <div className='login-socialBtn-google-icon'>
                  <img src={nextright} alt="nextright" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
