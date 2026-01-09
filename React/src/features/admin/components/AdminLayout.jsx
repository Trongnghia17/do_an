import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  SafetyOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/features/user/auth/store/auth.store';
import logo from "@/assets/images/logo.png";
import AuthDebug from './AuthDebug';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get user info from localStorage
  const userName = localStorage.getItem('userName') || 'Admin User';
  const userEmail = localStorage.getItem('userEmail') || '';

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      key: '/admin/exams',
      icon: <BookOutlined />,
      label: 'Quản lý bộ đề',
    },
    {
      key: '/admin/skills',
      icon: <BookOutlined />,
      label: 'Quản lý đề thi',
    },
    {
      key: '/admin/payment-packages',
      icon: <DollarOutlined />,
      label: 'Quản lý gói nạp',
    },
    {
      key: '/admin/ai-generator',
      icon: <RobotOutlined />,
      label: 'Tạo đề bằng AI',
    },
    {
      key: '/admin/analytics',
      icon: <BarChartOutlined />,
      label: 'Thống kê',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      // Handle logout - clear both Zustand store and localStorage
      logout();
      localStorage.clear();
      navigate('/admin/login');
    } else if (key === 'profile') {
      navigate('/admin/profile');
    } else if (key === 'settings') {
      navigate('/admin/settings');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AuthDebug />
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'white',
        }}
      >
        <div className="admin-logo">
          <img 
            src={logo} 
            alt="OwlEnglish Logo" 
            className={collapsed ? 'admin-logo__img admin-logo__img-collapsed' : 'admin-logo__img'}
          />
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Badge count={5}>
              <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
            </Badge>

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 500 }}>{userName}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
