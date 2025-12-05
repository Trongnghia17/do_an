import { Card, Col, Row, Statistic, Table, Tag, Progress } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    exams: 0,
    revenue: 0,
    growth: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch dashboard stats from API
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getDashboardStats();
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          users: 1234,
          exams: 567,
          revenue: 45678,
          growth: 12.5,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const recentUsers = [
    {
      key: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      date: '2024-01-15',
    },
    {
      key: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'active',
      date: '2024-01-14',
    },
    {
      key: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      status: 'inactive',
      date: '2024-01-13',
    },
  ];

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Users"
              value={stats.users}
              prefix={<UserOutlined />}
              loading={loading}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 16 }}>
              <ArrowUpOutlined style={{ color: '#3f8600' }} /> 8.5% from last month
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Exams"
              value={stats.exams}
              prefix={<BookOutlined />}
              loading={loading}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 16 }}>
              <ArrowUpOutlined style={{ color: '#3f8600' }} /> 12.3% from last month
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Revenue"
              value={stats.revenue}
              prefix={<DollarOutlined />}
              suffix="USD"
              loading={loading}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 16 }}>
              <ArrowDownOutlined style={{ color: '#cf1322' }} /> 2.1% from last month
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Growth Rate"
              value={stats.growth}
              prefix={<RiseOutlined />}
              suffix="%"
              loading={loading}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 16 }}>
              <ArrowUpOutlined style={{ color: '#3f8600' }} /> 5.2% from last month
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Recent Users" bordered={false}>
            <Table
              columns={userColumns}
              dataSource={recentUsers}
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="System Status" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Database</div>
              <Progress percent={85} status="active" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>API Server</div>
              <Progress percent={95} status="active" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Storage</div>
              <Progress percent={60} status="active" />
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>Memory</div>
              <Progress percent={75} status="active" />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
