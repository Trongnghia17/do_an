import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputNumber, Input, message, Modal, Space } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import api from '@/lib/axios';
import './AIGradingConfigManagement.css';

const { TextArea } = Input;

/**
 * Admin page để quản lý cấu hình giá chấm AI
 * Chỉ admin mới truy cập được
 */
export default function AIGradingConfigManagement() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/ai-grading-config');
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching configs:', error);
      message.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    form.setFieldsValue({
      cost_per_grading: config.cost_per_grading,
      description: config.description,
      is_active: config.is_active
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (values) => {
    try {
      await api.put(`/admin/ai-grading-config/${editingConfig.skill_type}`, values);
      message.success('Cập nhật thành công!');
      setIsModalOpen(false);
      fetchConfigs();
      form.resetFields();
      setEditingConfig(null);
    } catch (error) {
      console.error('Error updating config:', error);
      message.error('Cập nhật thất bại');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingConfig(null);
  };

  const columns = [
    {
      title: 'Loại kỹ năng',
      dataIndex: 'skill_type',
      key: 'skill_type',
      width: 150,
      render: (type) => (
        <span style={{ 
          textTransform: 'uppercase', 
          fontWeight: '600',
          color: type === 'writing' ? '#1677ff' : '#52c41a'
        }}>
          {type === 'writing' ? '✍️ WRITING' : '🎤 SPEAKING'}
        </span>
      )
    },
    {
      title: 'Chi phí (Trứng Cú)',
      dataIndex: 'cost_per_grading',
      key: 'cost_per_grading',
      width: 180,
      align: 'center',
      render: (cost) => (
        <span style={{ 
          fontSize: '1.25rem', 
          fontWeight: '700',
          color: '#f59e0b'
        }}>
          {cost} 🥚
        </span>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      align: 'center',
      render: (active) => (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: '500',
          background: active ? '#d1fae5' : '#fee2e2',
          color: active ? '#065f46' : '#991b1b'
        }}>
          {active ? '✅ Hoạt động' : '❌ Tắt'}
        </span>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Sửa
        </Button>
      )
    }
  ];

  return (
    <div className="ai-config-management">
      <div className="page-header">
        <h1>⚙️ Cấu hình AI Grading</h1>
        <p>Quản lý chi phí chấm bài tự động bằng AI</p>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={configs}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={`Cập nhật cấu hình - ${editingConfig?.skill_type?.toUpperCase()}`}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="Chi phí chấm AI (Trứng Cú)"
            name="cost_per_grading"
            rules={[
              { required: true, message: 'Vui lòng nhập chi phí' },
              { type: 'number', min: 0, message: 'Chi phí phải >= 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              addonAfter="🥚"
              placeholder="Nhập số Trứng Cú"
            />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="Mô tả về cấu hình này..."
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="is_active"
            valuePropName="checked"
          >
            <Space>
              <input type="checkbox" id="is_active_checkbox" />
              <label htmlFor="is_active_checkbox">Cho phép sử dụng</label>
            </Space>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Card style={{ marginTop: '1.5rem', background: '#fef3c7', border: '1px solid #fcd34d' }}>
        <h3 style={{ marginTop: 0, color: '#92400e' }}>💡 Lưu ý quan trọng</h3>
        <ul style={{ color: '#78350f', marginBottom: 0 }}>
          <li>Chi phí được tính bằng <strong>Trứng Cú (OWL)</strong></li>
          <li>Mỗi lần user sử dụng AI chấm điểm, số Trứng Cú sẽ bị trừ tự động</li>
          <li>User cần có đủ số dư trong ví để sử dụng tính năng</li>
          <li>Nếu tắt trạng thái, user sẽ không thể sử dụng AI chấm điểm</li>
          <li>Khuyến nghị: Writing và Speaking nên có giá tương đương nhau</li>
        </ul>
      </Card>
    </div>
  );
}
