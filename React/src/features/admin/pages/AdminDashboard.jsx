import { Card, Col, Row, Statistic, Table, Tag, Progress, Alert } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import adminService from '../services/adminService';

const AdminDashboard = () => {
  const [userStats, setUserStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [examCount, setExamCount] = useState(0);
  const [paymentStats, setPaymentStats] = useState({
    total_transactions: 0,
    total_amount: 0,
    paid_count: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userStatsData, examsData, paymentStatsData, recentUsersData] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getExams({ per_page: 100 }),
        adminService.getPaymentStatistics(),
        adminService.getRecentUsers(5),
      ]);

      if (userStatsData.status === 'fulfilled') {
        setUserStats(userStatsData.value);
      }

      if (examsData.status === 'fulfilled') {
        const exams = Array.isArray(examsData.value) ? examsData.value : (examsData.value?.items ?? []);
        setExamCount(exams.length);
      }

      if (paymentStatsData.status === 'fulfilled') {
        setPaymentStats(paymentStatsData.value);
      }

      if (recentUsersData.status === 'fulfilled') {
        const users = Array.isArray(recentUsersData.value)
          ? recentUsersData.value
          : (recentUsersData.value?.items ?? []);
        setRecentUsers(
          users.map((u) => ({
            key: u.id,
            name: u.name || '—',
            email: u.email,
            status: u.is_active ? 'active' : 'inactive',
            date: u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—',
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          action={
            <span
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={fetchDashboardData}
            >
              Thử lại
            </span>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Tổng người dùng"
              value={userStats.total}
              prefix={<UserOutlined />}
              loading={loading}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 16, color: '#666' }}>
              <CheckCircleOutlined style={{ color: '#3f8600' }} />{' '}
              {userStats.active} đang hoạt động
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Tổng đề thi"
              value={examCount}
              prefix={<BookOutlined />}
              loading={loading}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 16, color: '#666' }}>
              <BookOutlined /> Tất cả loại đề thi
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Doanh thu (VNĐ)"
              value={paymentStats.total_amount}
              prefix={<DollarOutlined />}
              loading={loading}
              valueStyle={{ color: '#cf1322' }}
              formatter={(v) => v.toLocaleString('vi-VN')}
            />
            <div style={{ marginTop: 16, color: '#666' }}>
              <ArrowUpOutlined style={{ color: '#3f8600' }} />{' '}
              {paymentStats.paid_count} giao dịch thành công
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Tổng giao dịch"
              value={paymentStats.total_transactions}
              prefix={<RiseOutlined />}
              loading={loading}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 16, color: '#666' }}>
              <ArrowUpOutlined style={{ color: '#3f8600' }} />{' '}
              {paymentStats.paid_count} đã thanh toán
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Người dùng gần đây" bordered={false}>
            <Table
              columns={userColumns}
              dataSource={recentUsers}
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Tỉ lệ người dùng" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Đang hoạt động</div>
              <Progress
                percent={
                  userStats.total > 0
                    ? Math.round((userStats.active / userStats.total) * 100)
                    : 0
                }
                status="active"
                format={(p) => `${p}%`}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Không hoạt động</div>
              <Progress
                percent={
                  userStats.total > 0
                    ? Math.round((userStats.inactive / userStats.total) * 100)
                    : 0
                }
                strokeColor="#f5222d"
                format={(p) => `${p}%`}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Giao dịch thành công</div>
              <Progress
                percent={
                  paymentStats.total_transactions > 0
                    ? Math.round(
                        (paymentStats.paid_count / paymentStats.total_transactions) * 100
                      )
                    : 0
                }
                status="active"
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
