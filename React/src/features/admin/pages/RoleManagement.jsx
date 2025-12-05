import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getRoles();
      
      // Mock data for now
      setTimeout(() => {
        setRoles([
          {
            id: '1',
            name: 'super_admin',
            description: 'Full system access',
            permissions: ['users.create', 'users.edit', 'users.delete', 'users.view', 'exams.create', 'exams.edit', 'exams.delete', 'exams.view'],
            userCount: 2,
          },
          {
            id: '2',
            name: 'admin',
            description: 'Administrative access',
            permissions: ['users.view', 'exams.create', 'exams.edit', 'exams.view'],
            userCount: 5,
          },
          {
            id: '3',
            name: 'user',
            description: 'Regular user access',
            permissions: ['exams.view'],
            userCount: 1234,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Failed to fetch roles');
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getPermissions();
      
      // Mock data
      setPermissions([
        { id: '1', name: 'users.view', description: 'View users' },
        { id: '2', name: 'users.create', description: 'Create users' },
        { id: '3', name: 'users.edit', description: 'Edit users' },
        { id: '4', name: 'users.delete', description: 'Delete users' },
        { id: '5', name: 'exams.view', description: 'View exams' },
        { id: '6', name: 'exams.create', description: 'Create exams' },
        { id: '7', name: 'exams.edit', description: 'Edit exams' },
        { id: '8', name: 'exams.delete', description: 'Delete exams' },
        { id: '9', name: 'roles.view', description: 'View roles' },
        { id: '10', name: 'roles.edit', description: 'Edit roles' },
      ]);
    } catch (error) {
      message.error('Failed to fetch permissions');
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRole(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteRole(id);
      
      message.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      message.error('Failed to delete role');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRole) {
        // TODO: Replace with actual API call
        // await adminService.updateRole(editingRole.id, values);
        message.success('Role updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createRole(values);
        message.success('Role created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchRoles();
    } catch (error) {
      message.error('Failed to save role');
    }
  };

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Tag color="blue">{name.toUpperCase()}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Space wrap>
          {permissions.slice(0, 3).map((perm) => (
            <Tag key={perm} color="green">{perm}</Tag>
          ))}
          {permissions.length > 3 && (
            <Tag>+{permissions.length - 3} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      sorter: (a, b) => a.userCount - b.userCount,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete role"
            description="Are you sure you want to delete this role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.name === 'super_admin'}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.name === 'super_admin'}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [module] = perm.name.split('.');
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Role & Permission Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} roles`,
        }}
      />

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please input role name!' }]}
          >
            <Input placeholder="Enter role name (e.g., editor, moderator)" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input description!' }]}
          >
            <Input.TextArea rows={2} placeholder="Enter role description" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[{ required: true, message: 'Please select at least one permission!' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <Col span={24} key={module}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <SafetyOutlined />
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </Space>
                      }
                    >
                      <Space direction="vertical">
                        {perms.map((perm) => (
                          <Checkbox key={perm.name} value={perm.name}>
                            {perm.description}
                          </Checkbox>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
