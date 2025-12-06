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
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import fastapiService from '@/services/fastapi.service';

const { TextArea } = Input;

const TestManagement = ({ examId }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (examId) {
      fetchTests();
    }
  }, [examId]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // Gọi FastAPI endpoint: GET /api/v1/exams/{exam_id}/tests
      const data = await adminService.getTestsByExamId(examId);
      
      // Transform data từ FastAPI format sang UI format
      const transformedTests = data.map(test => ({
        id: test.id,
        examId: test.exam_id,
        name: test.name,
        description: test.description,
        image: test.image,
        isActive: test.is_active,
        createdAt: test.created_at,
      }));
      
      setTests(transformedTests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tests:', error);
      message.error('Tải danh sách nhóm đề thi thất bại: ' + (error.response?.data?.detail || error.message));
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTest(null);
    setImageUrl('');
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingTest(record);
    setImageUrl(record.image || '');
    form.setFieldsValue({
      name: record.name,
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
      // Gọi FastAPI endpoint: DELETE /api/v1/exams/{exam_id}/tests/{test_id}
      await adminService.deleteTest(examId, id);
      
      message.success('Đã xóa nhóm đề thi thành công');
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      message.error('Xóa nhóm đề thi thất bại: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Transform UI data sang FastAPI format
      const testData = {
        name: values.name,
        description: values.description || '',
        image: values.image || null,
        is_active: values.isActive !== undefined ? values.isActive : true,
      };

      if (editingTest) {
        // Gọi FastAPI endpoint: PUT /api/v1/exams/{exam_id}/tests/{test_id}
        await adminService.updateTest(examId, editingTest.id, testData);
        message.success('Đã cập nhật nhóm đề thi thành công');
      } else {
        // Gọi FastAPI endpoint: POST /api/v1/exams/{exam_id}/tests
        await adminService.createTest(examId, testData);
        message.success('Đã tạo nhóm đề thi thành công');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      message.error('Lưu nhóm đề thi thất bại: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleViewSkills = (testId) => {
    navigate(`/admin/exams/${examId}/tests/${testId}`);
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image) => {
        if (!image) {
          return (
            <div style={{
              width: 50,
              height: 50,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}>
              <EyeOutlined style={{ fontSize: 20 }} />
            </div>
          );
        }
        
        const imageUrl = image.startsWith('http') ? image : `http://localhost:8000${image}`;
        
        return (
          <img
            src={imageUrl}
            alt="Test"
            style={{
              width: 50,
              height: 50,
              objectFit: 'cover',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="width:50px;height:50px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#999;"><span>❌</span></div>';
            }}
          />
        );
      },
    },
    {
      title: 'Tên nhóm đề thi',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
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
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSkills(record.id)}
          >
            Xem kỹ năng
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa nhóm đề thi"
            description="Bạn có chắc chắn muốn xóa nhóm đề thi này? Tất cả kỹ năng, phần thi và câu hỏi sẽ bị xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="link"
              size="small"
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Nhóm đề thi trong bộ đề</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Thêm nhóm đề thi
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tests}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} nhóm đề thi`,
        }}
      />

      <Modal
        title={editingTest ? 'Sửa nhóm đề thi' : 'Tạo nhóm đề thi mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
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
            label="Tên nhóm đề thi"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm đề thi!' }]}
          >
            <Input placeholder="VD: Test 1, Practice Test, Mock Test" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Nhập mô tả nhóm đề thi" />
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

export default TestManagement;
