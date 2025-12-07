import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import adminService from '../services/adminService';

const { Search } = Input;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      
      // Transform API data to match table structure
      const transformedUsers = data.map(user => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email,
        role: user.role_id === 1 ? 'admin' : 'student',
        isActive: user.is_active,
        createdAt: new Date(user.created_at).toLocaleDateString(),
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    // Set form values with proper mapping
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteUser(id);
      message.success('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.response?.data?.detail || 'Không thể xóa người dùng');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Transform role to role_id (1 = admin, 2 = student)
      const userData = {
        name: values.name,
        email: values.email,
        is_active: values.isActive,
        role_id: values.role === 'admin' ? 1 : 2,
      };

      if (editingUser) {
        await adminService.updateUser(editingUser.id, userData);
        message.success('Cập nhật người dùng thành công');
      } else {
        // For create, we need password
        const createData = {
          ...userData,
          password: values.password,
        };
        await adminService.createUser(createData);
        message.success('Thêm người dùng thành công');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      message.error(error.response?.data?.detail || 'Không thể lưu thông tin người dùng');
    }
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'QUẢN TRỊ' : 'HỌC VIÊN'}
        </Tag>
      ),
      filters: [
        { text: 'Quản trị', value: 'admin' },
        { text: 'Học viên', value: 'student' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      ),
      filters: [
        { text: 'Đang hoạt động', value: true },
        { text: 'Ngưng hoạt động', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Quản lý người dùng</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Thêm người dùng
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo tên hoặc email"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} người dùng`,
          pageSizeOptions: ['10', '20', '50', '100'],
          showQuickJumper: true,
          locale: {
            items_per_page: '/ trang',
            jump_to: 'Đi đến',
            jump_to_confirm: 'xác nhận',
            page: 'Trang',
            prev_page: 'Trang trước',
            next_page: 'Trang sau',
            prev_5: '5 trang trước',
            next_5: '5 trang sau',
            prev_3: '3 trang trước',
            next_3: '3 trang sau',
          },
        }}
        locale={{
          filterConfirm: 'Lọc',
          filterReset: 'Đặt lại',
          emptyText: 'Không có dữ liệu',
        }}
      />

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingUser ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="student">Học viên</Option>
              <Option value="admin">Quản trị</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái hoạt động"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
