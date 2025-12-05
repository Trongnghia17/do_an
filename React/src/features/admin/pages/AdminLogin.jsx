import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import fastapiService from '@/services/fastapi.service';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      // Call FastAPI login endpoint
      const response = await fastapiService.auth.login({
        email: values.email,
        password: values.password
      });
      
      // Store token and user info
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('userRole', user.role || 'user');
      localStorage.setItem('userName', user.name || user.email);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userId', user.id);
      
      message.success('Đăng nhập thành công!');
      
      // Check if user is admin or super_admin to navigate to admin panel
      if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin');
      } else {
        message.warning('Bạn không có quyền truy cập trang Admin');
        localStorage.clear();
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card
        style={{
          width: 400,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>🦉 OwlEnglish</h1>
          <h2 style={{ fontSize: 20, fontWeight: 'normal', color: '#666' }}>
            Admin Panel
          </h2>
        </div>

        <Form
          name="admin_login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              style={{ height: 45 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          fontSize: 13,
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>🔐 Demo Accounts:</div>
          <div>
            <strong>Admin:</strong><br />
            Email: admin@owlenglish.com<br />
            Password: admin123
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Super Admin:</strong><br />
            Email: superadmin@owlenglish.com<br />
            Password: super123
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
