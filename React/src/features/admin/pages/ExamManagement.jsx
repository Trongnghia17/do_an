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
  InputNumber,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';

const { Search, TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      // Gọi FastAPI endpoint: GET /api/v1/exams
      const data = await adminService.getExams({
        skip: 0,
        limit: 100,
        search: searchText || undefined,
      });
      
      // Transform data từ FastAPI format sang UI format
      const transformedExams = data.map(exam => ({
        id: exam.id,
        name: exam.name,
        type: exam.type,
        description: exam.description,
        image: exam.image,
        isActive: exam.is_active,
        createdAt: exam.created_at,
      }));
      
      setExams(transformedExams);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      message.error('Tải danh sách bộ đề thất bại: ' + (error.response?.data?.detail || error.message));
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingExam(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // Gọi FastAPI endpoint: DELETE /api/v1/exams/{id}
      await adminService.deleteExam(id);
      
      message.success('Đã xóa bộ đề thành công');
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      message.error('Xóa bộ đề thất bại: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Transform UI data sang FastAPI format
      const examData = {
        name: values.name,
        type: values.type,
        description: values.description || '',
        image: values.image || null,
        is_active: values.isActive !== undefined ? values.isActive : true,
      };

      if (editingExam) {
        // Gọi FastAPI endpoint: PUT /api/v1/exams/{id}
        await adminService.updateExam(editingExam.id, examData);
        message.success('Đã cập nhật bộ đề thành công');
      } else {
        // Gọi FastAPI endpoint: POST /api/v1/exams
        await adminService.createExam(examData);
        message.success('Đã tạo bộ đề thành công');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchExams();
    } catch (error) {
      console.error('Error saving exam:', error);
      message.error('Lưu bộ đề thất bại: ' + (error.response?.data?.detail || error.message));
    }
  };

  const columns = [
    {
      title: 'Tên bộ đề',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          ielts: 'blue',
          toeic: 'green',
          online: 'orange',
        };
        const labels = {
          ielts: 'IELTS',
          toeic: 'TOEIC',
          online: 'ONLINE',
        };
        return <Tag color={colors[type]}>{labels[type]}</Tag>;
      },
      filters: [
        { text: 'IELTS', value: 'ielts' },
        { text: 'TOEIC', value: 'toeic' },
        { text: 'Online', value: 'online' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hiển thị' : 'Ẩn'}
        </Tag>
      ),
      filters: [
        { text: 'Hiển thị', value: true },
        { text: 'Ẩn', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/exams/${record.id}`)}
          >
            Xem chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa bộ đề"
            description="Bạn có chắc chắn muốn xóa bộ đề này?"
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

  const filteredExams = exams.filter((exam) =>
    exam.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Quản lý bộ đề</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Thêm bộ đề
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm bộ đề theo tên"
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
        dataSource={filteredExams}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bộ đề`,
        }}
      />

      <Modal
        title={editingExam ? 'Sửa bộ đề' : 'Tạo bộ đề mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên bộ đề"
            rules={[{ required: true, message: 'Vui lòng nhập tên bộ đề!' }]}
          >
            <Input placeholder="VD: IELTS Academic, TOEIC Practice" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Nhập mô tả bộ đề" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại bộ đề"
            rules={[{ required: true, message: 'Vui lòng chọn loại bộ đề!' }]}
          >
            <Select placeholder="Chọn loại bộ đề">
              <Option value="ielts">IELTS</Option>
              <Option value="toeic">TOEIC</Option>
              <Option value="online">Online</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="Hình ảnh"
          >
            <Input placeholder="URL hình ảnh" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Hiển thị"
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

export default ExamManagement;
