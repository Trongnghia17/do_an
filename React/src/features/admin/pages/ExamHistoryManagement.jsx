import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
  Button,
  message,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import fastapiService from '@/services/fastapi.service';

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;

const SKILL_TYPE_LABELS = {
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
};

const SKILL_COLORS = {
  listening: 'blue',
  speaking: 'purple',
  reading: 'green',
  writing: 'orange',
};

const STATUS_CONFIG = {
  completed: { color: 'processing', icon: <ClockCircleOutlined />, text: 'Đã nộp' },
  graded:    { color: 'success',    icon: <CheckCircleOutlined />,  text: 'Đã chấm' },
  in_progress: { color: 'warning',  icon: <ClockCircleOutlined />,  text: 'Đang làm' },
};

export default function ExamHistoryManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState({
    search: '',
    skill_type: null,
    status: null,
  });

  // Summary stats
  const [stats, setStats] = useState({ total: 0, graded: 0, completed: 0 });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
      };
      if (filters.search)     params.search       = filters.search;
      if (filters.skill_type) params.skill_type   = filters.skill_type;
      if (filters.status)     params.status_filter = filters.status;

      const res = await fastapiService.submission.adminGetAllSubmissions(params);
      const data = res.data;

      setSubmissions(data.data || []);
      setTotal(data.total || 0);

      // Tính stats từ dữ liệu trả về (page hiện tại)
      const all = data.data || [];
      setStats({
        total: data.total || 0,
        graded: all.filter(s => s.status === 'graded').length,
        completed: all.filter(s => s.status === 'completed').length,
      });
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lịch sử làm bài');
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleTableChange = (pag) => {
    setPagination({ current: pag.current, pageSize: pag.pageSize });
  };

  const handleSearch = (val) => {
    setFilters(f => ({ ...f, search: val }));
    setPagination(p => ({ ...p, current: 1 }));
  };

  const handleSkillFilter = (val) => {
    setFilters(f => ({ ...f, skill_type: val || null }));
    setPagination(p => ({ ...p, current: 1 }));
  };

  const handleStatusFilter = (val) => {
    setFilters(f => ({ ...f, status: val || null }));
    setPagination(p => ({ ...p, current: 1 }));
  };

  const getStatusTag = (status) => {
    const cfg = STATUS_CONFIG[status] || { color: 'default', icon: null, text: status };
    return (
      <Tag color={cfg.color} icon={cfg.icon}>
        {cfg.text}
      </Tag>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const calcAccuracy = (correct, wrong) => {
    const total = (correct || 0) + (wrong || 0);
    if (!total) return null;
    return Math.round(((correct || 0) / total) * 100);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Học sinh',
      key: 'user',
      width: 200,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{r.user_name || '—'}</span>
          <span style={{ color: '#888', fontSize: 12 }}>{r.user_email}</span>
        </Space>
      ),
    },
    {
      title: 'Đề thi',
      dataIndex: 'skill_name',
      key: 'skill_name',
      render: (name) => name || '—',
    },
    {
      title: 'Kỹ năng',
      dataIndex: 'skill_type',
      key: 'skill_type',
      width: 110,
      render: (type) => (
        <Tag color={SKILL_COLORS[type] || 'default'}>
          {SKILL_TYPE_LABELS[type] || type || '—'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s) => getStatusTag(s),
    },
    {
      title: 'Thời gian',
      dataIndex: 'time_spent',
      key: 'time_spent',
      width: 100,
      render: (v) => v || '—',
    },
    {
      title: 'Điểm',
      key: 'score',
      width: 100,
      render: (_, r) => (
        r.max_score
          ? `${r.total_score ?? 0} / ${r.max_score}`
          : '—'
      ),
    },
    {
      title: 'Tỉ lệ đúng',
      key: 'accuracy',
      width: 100,
      render: (_, r) => {
        const acc = calcAccuracy(r.correct, r.wrong);
        if (acc === null) return '—';
        const color = acc >= 70 ? '#52c41a' : acc >= 50 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{acc}%</span>;
      },
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 160,
      render: (v) => formatDate(v),
      sorter: (a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/exam-history/${r.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px' }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <FileDoneOutlined style={{ marginRight: 8 }} />
        Lịch sử làm bài – Toàn hệ thống
      </Title>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng bài nộp"
              value={total}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã chấm (trang này)"
              value={stats.graded}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ chấm (trang này)"
              value={stats.completed}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10}>
            <Search
              placeholder="Tìm theo email hoặc tên học sinh…"
              allowClear
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Select
              placeholder="Kỹ năng"
              allowClear
              style={{ width: '100%' }}
              onChange={handleSkillFilter}
            >
              <Option value="listening">Listening</Option>
              <Option value="speaking">Speaking</Option>
              <Option value="reading">Reading</Option>
              <Option value="writing">Writing</Option>
            </Select>
          </Col>
          <Col xs={12} sm={5}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusFilter}
            >
              <Option value="completed">Đã nộp</Option>
              <Option value="graded">Đã chấm</Option>
              <Option value="in_progress">Đang làm</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} style={{ textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={fetchSubmissions}>
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={submissions}
          columns={columns}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (t) => `Tổng ${t} bài`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
