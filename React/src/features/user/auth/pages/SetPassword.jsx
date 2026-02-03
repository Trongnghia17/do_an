import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

const { Title, Text } = Typography;

export default function SetPassword() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/set-password', {
        password: values.password,
        confirm_password: values.confirm_password,
      });

      message.success(response.data.message || 'Password set successfully!');
      
      // Redirect to profile or home
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      message.error(
        error.response?.data?.detail || 'Failed to set password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#045CCE',
        padding: '20px',
      }}
    >
      <Card
        style={{
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#667eea' }} />
          <Title level={2} style={{ marginTop: '16px', marginBottom: '8px' }}>
            Set Your Password
          </Title>
          <Text type="secondary">
            You logged in with Google. Set a password to enable email login.
          </Text>
        </div>

        <Form
          name="set-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('The two passwords do not match')
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              Set Password
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/')}>
              Skip for now
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
