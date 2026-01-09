import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Card
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '@/lib/axios';
import './PaymentPackageManagement.css';

export default function PaymentPackageManagement() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Debug: Check user info
    console.log('=== Payment Package Management Debug ===');
    console.log('roleId from localStorage:', localStorage.getItem('roleId'));
    console.log('userName:', localStorage.getItem('userName'));
    
    // Check current user from API
    api.get('/auth/me')
      .then(res => {
        console.log('Current user from API:', res.data);
        console.log('User role_id:', res.data.role_id);
      })
      .catch(err => {
        console.error('Error getting current user:', err);
      });
    
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      console.log('Fetching payment packages...');
      const res = await api.get('/admin/payment-packages?include_inactive=true');
      console.log('Payment packages response:', res.data);
      setPackages(res.data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      if (err.response?.status === 403) {
        message.error('Bạn không có quyền truy cập. Cần role admin (role_id = 1)');
      } else {
        message.error('Không thể tải danh sách gói nạp');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      bonus_owl: 0,
      display_order: 0
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPackage(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/payment-packages/${id}`);
      message.success('Đã xóa gói nạp');
      fetchPackages();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Không thể xóa gói nạp');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingPackage) {
        await api.put(`/admin/payment-packages/${editingPackage.id}`, values);
        message.success('Đã cập nhật gói nạp');
      } else {
        await api.post('/admin/payment-packages', values);
        message.success('Đã tạo gói nạp mới');
      }
      setModalVisible(false);
      fetchPackages();
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
      sorter: (a, b) => a.display_order - b.display_order
    },
    {
      title: 'Nhãn',
      dataIndex: 'label',
      key: 'label',
      width: 120
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Trứng Cú',
      key: 'owl',
      width: 100,
      render: (_, record) => (
        <span>{record.owl_amount.toLocaleString()}</span>
      )
    },
    {
      title: 'Bonus',
      dataIndex: 'bonus_owl',
      key: 'bonus_owl',
      width: 100,
      render: (bonus) => (
        bonus > 0 ? (
          <Tag color="green">+{bonus.toLocaleString()}</Tag>
        ) : (
          <span>-</span>
        )
      )
    },
    {
      title: 'Tổng nhận',
      key: 'total',
      width: 120,
      render: (_, record) => (
        <strong style={{color: '#045CCE'}}>
          {(record.owl_amount + record.bonus_owl).toLocaleString()} 🥚
        </strong>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? 'Hoạt động' : 'Tắt'}
        </Tag>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa gói nạp này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="payment-package-management">
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Quản lý gói nạp Trứng Cú</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm gói mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} gói`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingPackage ? 'Chỉnh sửa gói nạp' : 'Tạo gói nạp mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Số tiền (VNĐ)"
            name="amount"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={1000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            label="Số Trứng Cú cơ bản"
            name="owl_amount"
            rules={[{ required: true, message: 'Vui lòng nhập số Trứng Cú' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            label="Trứng Cú bonus"
            name="bonus_owl"
            tooltip="Số Trứng Cú thưởng thêm"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Nhãn hiển thị"
            name="label"
            tooltip="Ví dụ: 10,000đ, 50,000đ..."
          >
            <Input placeholder="10,000đ" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả về gói nạp..."
            />
          </Form.Item>

          <Form.Item
            label="Thứ tự hiển thị"
            name="display_order"
            tooltip="Số càng nhỏ hiển thị càng trước"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="Kích hoạt"
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
