import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.login(values);
      
      // Mock login for now
      if (values.email === 'admin@owlenglish.com' && values.password === 'admin123') {
        // Store token and user info
        localStorage.setItem('token', 'mock-admin-token-' + Date.now());
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userName', 'Admin User');
        localStorage.setItem('userEmail', values.email);
        
        message.success('Login successful!');
        navigate('/admin');
      } else if (values.email === 'superadmin@owlenglish.com' && values.password === 'super123') {
        localStorage.setItem('token', 'mock-superadmin-token-' + Date.now());
        localStorage.setItem('userRole', 'super_admin');
        localStorage.setItem('userName', 'Super Admin');
        localStorage.setItem('userEmail', values.email);
        
        message.success('Login successful!');
        navigate('/admin');
      } else {
        message.error('Invalid credentials');
      }
    } catch (error) {
      message.error('Login failed');
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
