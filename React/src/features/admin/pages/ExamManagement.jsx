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
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
  EyeOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import fastapiService from '@/services/fastapi.service';

const { Search, TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
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
    setImageUrl('');
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    console.log('Editing exam:', record);
    setEditingExam(record);
    setImageUrl(record.image || '');
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      description: record.description,
      image: record.image,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const response = await fastapiService.upload.uploadImage(file);
      const url = response.data.url;
      
      // Set image URL to form and state
      setImageUrl(url);
      form.setFieldsValue({ image: url });
      
      message.success('Tải hình ảnh lên thành công!');
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Tải hình ảnh lên thất bại: ' + (error.response?.data?.detail || error.message));
      return false;
    } finally {
      setUploading(false);
    }
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
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image) => {
        if (!image) {
          return (
            <div style={{
              width: 60,
              height: 60,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}>
              <BookOutlined style={{ fontSize: 24 }} />
            </div>
          );
        }
        
        const imageUrl = image.startsWith('http') ? image : `http://localhost:8000${image}`;
        
        return (
          <img
            src={imageUrl}
            alt="Exam"
            style={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="width:60px;height:60px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#999;"><span>❌</span></div>';
            }}
          />
        );
      },
    },
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
        };
        const labels = {
          ielts: 'IELTS',
          toeic: 'TOEIC',
        };
        return <Tag color={colors[type]}>{labels[type]}</Tag>;
      },
      filters: [
        { text: 'IELTS', value: 'ielts' },
        { text: 'TOEIC', value: 'toeic' },
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
            
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            
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
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="Hình ảnh"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                accept="image/*"
                beforeUpload={handleUpload}
                showUploadList={false}
                disabled={uploading}
              >
                <Button 
                  icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                  disabled={uploading}
                >
                  {uploading ? 'Đang tải lên...' : 'Tải hình ảnh lên'}
                </Button>
              </Upload>
              
              {imageUrl && (
                <div style={{ marginTop: 8 }}>
                  <img 
                    src={`http://localhost:8000${imageUrl}`} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9'
                    }} 
                  />
                </div>
              )}
              
              <Input 
                placeholder="Hoặc nhập URL hình ảnh" 
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  form.setFieldsValue({ image: e.target.value });
                }}
              />
            </Space>
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
