import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/features/auth/store/auth.store';
import u_setting from "../../assets/images/u_setting.svg";
import u_setting_active from "../../assets/images/u_setting_active.svg";
import dongho from "../../assets/images/dongho.svg";
import dongho_active from "../../assets/images/dongho_active.svg";
import lsthanhtoan from "../../assets/images/lsthanhtoan.svg";
import lsthanhtoan_active from "../../assets/images/lsthanhtoan_active.svg";
import lsgiaodich from "../../assets/images/lsgiaodich.svg";
import lsgiaodich_active from "../../assets/images/lsgiaodich_active.svg";
import lsdangnhap from "../../assets/images/lsdangnhap.svg";
import lsdangnhap_active from "../../assets/images/lsdangnhap_active.svg";
import './Sidebar.css';

export default function Sidebar() {
  const nav = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const go = useCallback((path) => {
    nav(path);
  }, [nav]);

  const handleProfile = () => go('/trang-ca-nhan');
  const handleHistory = () => go('/lich-su-lam-bai');
  const handlePayment = () => go('/lich-su-thanh-toan');
  const handleTransactions = () => go('/lich-su-giao-dich-owl');
  const handleLogins = () => go('/lich-su-dang-nhap');
  const handleLogout = () => {
    logout();
    go('/');
  };

  const isActive = (prefix) => location.pathname.startsWith(prefix);

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <button
          className={`sidebar__menu-item ${isActive('/trang-ca-nhan') ? 'active' : ''}`}
          onClick={handleProfile}
        >
          <span className="sidebar__menu-icon"><img src={u_setting} alt="" /></span>
          <span className="sidebar__menu-icon-active"><img src={u_setting_active} alt="" /></span>
          <span className="sidebar__menu-text">Thông tin tài khoản</span>
        </button>

        <button
          className={`sidebar__menu-item ${isActive('/lich-su-lam-bai') ? 'active' : ''}`}
          onClick={handleHistory}
        >
          <span className="sidebar__menu-icon"><img src={dongho} alt="" /></span>
          <span className="sidebar__menu-icon-active"><img src={dongho_active} alt="" /></span>
          <span className="sidebar__menu-text">Lịch sử làm bài</span>
        </button>

        <button
          className={`sidebar__menu-item ${isActive('/lich-su-thanh-toan') ? 'active' : ''}`}
          onClick={handlePayment}
        >
          <span className="sidebar__menu-icon"><img src={lsthanhtoan} alt="" /></span>
          <span className="sidebar__menu-icon-active"><img src={lsthanhtoan_active} alt="" /></span>
          <span className="sidebar__menu-text">Lịch sử thanh toán</span>
        </button>

        <button
          className={`sidebar__menu-item ${isActive('/lich-su-giao-dich-owl') ? 'active' : ''}`}
          onClick={handleTransactions}
        >
          <span className="sidebar__menu-icon"><img src={lsgiaodich} alt="" /></span>
          <span className="sidebar__menu-icon-active"><img src={lsgiaodich_active} alt="" /></span>
          <span className="sidebar__menu-text">Lịch sử giao dịch OWL</span>
        </button>

        <button
          className={`sidebar__menu-item ${isActive('/lich-su-dang-nhap') ? 'active' : ''}`}
          onClick={handleLogins}
        >
          <span className="sidebar__menu-icon"><img src={lsdangnhap} alt="" /></span>
          <span className="sidebar__menu-icon-active"><img src={lsdangnhap_active} alt="" /></span>
          <span className="sidebar__menu-text">Lịch sử đăng nhập</span>
        </button>
      </nav>
    </aside>
  );
}