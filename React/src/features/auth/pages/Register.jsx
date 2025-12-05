import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Modal, Button, Space } from 'antd';
import { toast } from 'react-toastify';
import useAuth from '@/features/auth/store/auth.store';
import api from '@/lib/axios';
import logo from "../../../assets/images/logo.png";
import imgleftlogin from "../../../assets/images/imgleftlogin.png";
import emailimg from "../../../assets/images/email.svg";
import u_phone from "../../../assets/images/u_phone.svg";
import passwordimg from "../../../assets/images/password.svg";
import logofacebook from "../../../assets/images/facebook.svg";
import logogoogle from "../../../assets/images/google.svg";
import nextright from "../../../assets/images/nextright.svg";
import eye from "../../../assets/images/eye.svg";
import eyeSlash from "../../../assets/images/eye-slash.svg";
import './Login.css';

export default function Register() {
  const nav = useNavigate();
  const { setToken, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Email không hợp lệ");
      return false;
    }
    if (!phone.match(/^[0-9]{9,11}$/)) {
      toast.error("Số điện thoại không hợp lệ (9-11 số)");
      return false;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsModalOpen(true);
  };

  const handleSendCode = async (method) => {
    try {
      await api.post("api/otp/send", {
        channel: method,
        destination: method === "email" ? email : phone,
        email,
        purpose: "register",
      });
      toast.success(
        `Mã xác nhận đã được gửi qua ${method === "email" ? "Email" : "Zalo OA"}`
      );
      setIsModalOpen(false);

      nav("/verify-otp", {
        state: {
          email,
          password,
          channel: method,
          destination: method === "email" ? email : phone,
          password,
        },
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Gửi OTP thất bại");
      setIsModalOpen(false);
    }
  };


  const socialRedirect = (provider) => {
    const map = {
      google: `${import.meta.env.VITE_API_BASE_URL}/oauth/google/redirect`,
      facebook: `${import.meta.env.VITE_API_BASE_URL}/oauth/facebook/redirect`,
    };
    window.location.href = map[provider];
  };

  return (
    <div className="login-wrapper register-wrapper">
      <div className="login-imgleftmain">

      </div>
      <div className="login-cardmain">
        <div className='login-card'>
          <div className='logo-div'>
            <img className='logo' src={logo} alt="logo-phi-dang" />
          </div>
          <h2 className='title-login'>Tạo tài khoản</h2>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            {/* Email */}
            <div className='login-input-container'>
              <input
                className="login-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <img className='key-logo-input' src={emailimg} alt="email-img" />
            </div>

            {/* Phone */}
            <div className='login-input-container'>
              <input
                className="login-input"
                type="text"
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <img className='key-logo-input' src={u_phone} alt="u_phone" />
            </div>

            {/* Password */}
            <div className='login-input-container'>
              <input
                className="login-input"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Confirm Password */}
            <div className='login-input-container'>
              <input
                className="login-input"
                type={showPassword2 ? "text" : "password"}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <img className='key-logo-input' src={passwordimg} alt="passwordimg-img" />
              <img
                src={showPassword2 ? eyeSlash : eye}
                alt="toggle-password"
                className="toggle-password"
                onClick={() => setShowPassword2(!showPassword2)}
                style={{ cursor: "pointer" }}
              />
            </div>

            <button className="login-primaryBtn" type="submit">Tạo tài khoản</button>
          </form>

          <div className='login-register'>
            Bạn đã có tài khoản? <Link className='login-register-link' to="/login">Đăng nhập</Link>
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
      <Modal
        title="Chọn phương thức nhận mã xác nhận"
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        className='modal-register'
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" className='btn-select-register' block onClick={() => handleSendCode("email")}>
            Gửi mã qua Email
          </Button>
          <Button type="default" className='btn-select-register' block onClick={() => handleSendCode("zalo_oa")}>
            Gửi mã qua Zalo OA
          </Button>
        </Space>
      </Modal>
    </div>
  );
}
