import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import useAuth from '@/features/user/auth/store/auth.store';
import fastapiService from '@/services/fastapi.service';
import logo from "@/assets/images/logo.png";
import fi_bell from "@/assets/images/fi_bell.svg";
import Capa_1 from "@/assets/images/Capa_1.svg";
import avatar_default from "@/assets/images/avatar_default.svg";
import u_setting from "@/assets/images/u_setting.svg";
import dongho from "@/assets/images/dongho.svg";
import dangxuat from "@/assets/images/dangxuat.svg";
import lsthanhtoan from "@/assets/images/lsthanhtoan.svg";
import lsdangnhap from "@/assets/images/lsdangnhap.svg";
import lsgiaodich from "@/assets/images/lsgiaodich.svg";
import './Topbar.css';

export default function Topbar() {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);

  const handleLogin = () => nav('/login');

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  // Fetch wallet balance when user is logged in
  useEffect(() => {
    const fetchWallet = async () => {
      if (token && user) {
        try {
          const response = await fastapiService.payment.getWallet();
          setWalletBalance(response.data?.balance || 0);
        } catch (error) {
          console.error('Error fetching wallet:', error);
          setWalletBalance(0);
        }
      }
    };
    
    fetchWallet();
  }, [token, user]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleProfile = () => { setOpenMenu(false); nav('/trang-ca-nhan'); };
  const handleHistory = () => { setOpenMenu(false); nav('/lich-su-lam-bai'); };
  const handlePaymentHistory = () => { setOpenMenu(false); nav('/lich-su-thanh-toan'); };
  const handleTransactionHistory = () => { setOpenMenu(false); nav('/lich-su-giao-dich-owl'); };
  const handleLoginHistory = () => { setOpenMenu(false); nav('/lich-su-dang-nhap'); };
  const handleLogout = () => { setOpenMenu(false); logout(); nav('/'); };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <img className="topbar__logo" src={logo} alt="owl-logo" />
        <nav className="topbar__nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'topbar__link topbar__link--active' : 'topbar__link'}>Trang chủ</NavLink>
          <NavLink to="/de-thi-online" className={({isActive}) => isActive ? 'topbar__link topbar__link--active' : 'topbar__link'}>Đề thi online</NavLink>
          <NavLink to="/bo-de/ielts" className={({isActive}) => isActive ? 'topbar__link topbar__link--active' : 'topbar__link'}>Bộ đề IELTS</NavLink>
          <NavLink to="/bo-de/toeic" className={({isActive}) => isActive ? 'topbar__link topbar__link--active' : 'topbar__link'}>Bộ đề TOEIC</NavLink>
          <NavLink target="_blank" to="https://owlenglish.vn/" className={({isActive}) => isActive ? 'topbar__link topbar__link--active' : 'topbar__link'}>Về Owl</NavLink>
        </nav>
      </div>

      <div className="topbar__right">
        {!token && (
          <button className="topbar__login" onClick={handleLogin}>Đăng nhập</button>
        )}

        {token && (
          <>
            <button title="Trứng cú" className="topbar__egg" aria-label="egg">
              <img className="topbar__egg-img" src={Capa_1} alt="trứng cú" />
              {walletBalance.toLocaleString()} trứng Cú
            </button>

            <button title="Thông báo" className="topbar__icon" aria-label="notifications">
              <img src={fi_bell} alt="chuong" />
            </button>

            <div className="topbar__avatar-wrap" ref={menuRef}>
              <button
                aria-haspopup="true"
                aria-expanded={openMenu}
                onClick={() => setOpenMenu(v => !v)}
                className="topbar__avatar-btn"
              >
                <img src={avatar_default} alt="avatar" className="topbar__avatar-img" />
              </button>

              {openMenu && (
                <div className="topbar__dropdown">
                  <div className="topbar__dropdown-header">
                    <img src={avatar_default} alt="avatar" className="topbar__dropdown-avatar" />
                    <div className="topbar__dropdown-info">
                      <div className="topbar__dropdown-name">{user?.name || 'User'}</div>
                      <div className="topbar__dropdown-email">{user?.email || user?.phone || ''}</div>
                    </div>
                  </div>

                  <button className="topbar__menu-item" onClick={handleProfile}>
                    <span className="topbar__menu-icon">
                      <img src={u_setting} alt="" />
                    </span>
                    <span className="topbar__menu-text">Thông tin tài khoản</span>
                  </button>

                  <button className="topbar__menu-item" onClick={handleHistory}>
                    <span className="topbar__menu-icon">
                      <img src={dongho} alt="" />
                    </span>
                    <span className="topbar__menu-text">Lịch sử làm bài</span>
                  </button>

                  <button className="topbar__menu-item" onClick={handlePaymentHistory}>
                    <span className="topbar__menu-icon">
                      <img src={lsthanhtoan} alt="" />
                    </span>
                    <span className="topbar__menu-text">Lịch sử thanh toán</span>
                  </button>

                  <button className="topbar__menu-item" onClick={handleTransactionHistory}>
                    <span className="topbar__menu-icon">
                      <img src={lsgiaodich} alt="" />
                    </span>
                    <span className="topbar__menu-text">Lịch sử giao dịch OWL</span>
                  </button>

                  <button className="topbar__menu-item" onClick={handleLoginHistory}>
                    <span className="topbar__menu-icon">
                      <img src={lsdangnhap} alt="" />
                    </span>
                    <span className="topbar__menu-text">Lịch sử đăng nhập</span>
                  </button>

                  <button className="topbar__menu-item topbar__menu-item-logout" onClick={handleLogout}>
                    <span className="topbar__menu-icon">
                      <img src={dangxuat} alt="" />
                    </span>
                    <span className="topbar__menu-text topbar__menu-text-logout">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}