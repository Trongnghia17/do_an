import Sidebar from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Footer from './Footer';
import './MainLayout.css';

export default function MainLayout({ children }) {
  const location = useLocation();

  // danh sách prefix của các route thuộc "users" — chỉnh theo project của bạn
  const userRoutePrefixes = [
    '/trang-ca-nhan',
    '/lich-su-lam-bai',
    '/lich-su-thanh-toan',
    '/lich-su-giao-dich-owl',
    '/lich-su-dang-nhap',
  ];

  const showSidebar = userRoutePrefixes.some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <div className="main-layout">
      {/* Header */}
      <Topbar />
      <div className={`main-body ${showSidebar ? 'with-sidebar' : 'full-width'}` }>
        {showSidebar && <Sidebar />}
        {/* Nội dung chính */}
        <div className={`main-content ${showSidebar ? 'with-sidebar-user' : 'full-width-user'}`}>
         <div className='main-content__inner'>
           <Outlet />
         </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}