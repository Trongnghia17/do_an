import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

const TestManagement = ({ examId }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, [examId]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getTestsByExamId(examId);
      
      // Mock data
      setTimeout(() => {
        setTests([
          {
            id: '1',
            examId: examId,
            name: 'Academic Test 1',
            description: 'First practice test',
            image: null,
            isActive: true,
            createdAt: '2024-01-01',
          },
          {
            id: '2',
            examId: examId,
            name: 'Academic Test 2',
            description: 'Second practice test',
            image: null,
            isActive: true,
            createdAt: '2024-01-02',
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch tests');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTest(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingTest(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteTest(id);
      
      message.success('Test deleted successfully');
      fetchTests();
    } catch (error) {
      message.error('Failed to delete test');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTest) {
        // TODO: Replace with actual API call
        // await adminService.updateTest(editingTest.id, values);
        message.success('Test updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createTest(examId, values);
        message.success('Test created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchTests();
    } catch (error) {
      message.error('Failed to save test');
    }
  };

  const handleViewSkills = (testId) => {
    navigate(`/admin/exams/${examId}/tests/${testId}`);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSkills(record.id)}
          >
            Skills
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete test"
            description="Are you sure? This will delete all skills, sections, and questions."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Tests in this Exam</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Test
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tests}
        loading={loading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingTest ? 'Edit Test' : 'Create Test'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Test Name"
            rules={[{ required: true, message: 'Please input test name!' }]}
          >
            <Input placeholder="Enter test name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Enter test description" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Image URL"
          >
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
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

export default TestManagement;
