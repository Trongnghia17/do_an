import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  message, 
  Tag, 
  Input, 
  Select, 
  Space, 
  Row, 
  Col, 
  Statistic,
  Spin,
  DatePicker,
  Typography,
  Tooltip
} from 'antd';
import { 
  DollarOutlined, 
  TransactionOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '@/lib/axios';
import './PaymentHistoryManagement.css';

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function PaymentHistoryManagement() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: null,
    search: ''
  });

  useEffect(() => {
    fetchStatistics();
    fetchPayments();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchStatistics = async () => {
    try {
      console.log('Fetching payment statistics...');
      const res = await api.get('/admin/payments/statistics');
      console.log('Statistics response:', res.data);
      setStatistics(res.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      console.error('Error details:', err.response?.data);
      message.error(err?.response?.data?.detail || 'Không thể tải thống kê');
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize
      };

      if (filters.status) {
        params.status_filter = filters.status;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      console.log('Fetching payments with params:', params);
      const res = await api.get('/admin/payments/history', { params });
      console.log('Payments response:', res.data);
      console.log('Total payments:', res.data.length);
      
      setPayments(res.data);
      
      // Update pagination total if needed
      if (res.data.length > 0) {
        setPagination(prev => ({ ...prev, total: res.data.length }));
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      message.error(err?.response?.data?.detail || 'Không thể tải lịch sử thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const handleStatusFilter = (value) => {
    setFilters({ ...filters, status: value });
    setPagination({ ...pagination, current: 1 }); // Reset to first page
  };

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 }); // Reset to first page
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      PAID: { color: 'success', icon: <CheckCircleOutlined />, text: 'Đã thanh toán' },
      PENDING: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Đang chờ' },
      CANCELLED: { color: 'error', icon: <CloseCircleOutlined />, text: 'Đã hủy' },
      EXPIRED: { color: 'default', icon: <CloseCircleOutlined />, text: 'Hết hạn' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <Tooltip title={text}>
          <span className="order-code">{text.substring(0, 12)}...</span>
        </Tooltip>
      )
    },
    {
      title: 'Học sinh',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <div className="user-info">
          <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <div>
            <div className="user-email">{record.user_email}</div>
            {record.user_name && (
              <div className="user-name">{record.user_name}</div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount) => (
        <span className="amount-text">{formatCurrency(amount)}</span>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Trứng Cú',
      dataIndex: 'owl_amount',
      key: 'owl_amount',
      width: 120,
      align: 'center',
      render: (owlAmount) => (
        <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
          {owlAmount.toLocaleString()} 🥚
        </Tag>
      ),
      sorter: (a, b) => a.owl_amount - b.owl_amount
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Đã thanh toán', value: 'PAID' },
        { text: 'Đang chờ', value: 'PENDING' },
        { text: 'Đã hủy', value: 'CANCELLED' },
        { text: 'Hết hạn', value: 'EXPIRED' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Ghi chú',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-'
    }
  ];

  return (
    <div className="payment-history-management">
      <div className="page-header">
        <Title level={2}>
          <TransactionOutlined /> Lịch sử nạp Trứng Cú
        </Title>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={16} className="statistics-row">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng giao dịch"
                value={statistics.total_transactions}
                prefix={<TransactionOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={statistics.total_amount}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
                formatter={(value) => formatCurrency(value)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Trứng Cú đã bán"
                value={statistics.total_owl_sold}
                suffix="🥚"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Thành công"
                value={statistics.paid_count}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix={`/ ${statistics.total_transactions}`}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card className="filter-card">
        <Space size="middle" wrap>
          <Search
            placeholder="Tìm theo email, tên, hoặc mã GD..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 180 }}
            onChange={handleStatusFilter}
          >
            <Option value="PAID">Đã thanh toán</Option>
            <Option value="PENDING">Đang chờ</Option>
            <Option value="CANCELLED">Đã hủy</Option>
            <Option value="EXPIRED">Hết hạn</Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <p style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '12px' }}>
                  📊 Chưa có dữ liệu thanh toán
                </p>
                <p style={{ fontSize: '14px', color: '#bfbfbf' }}>
                  Dữ liệu sẽ hiển thị khi có học sinh nạp Trứng Cú
                </p>
              </div>
            )
          }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
