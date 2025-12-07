import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Popconfirm,
  Upload,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  LoadingOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import adminService from '../services/adminService';
import fastapiService from '@/services/fastapi.service';

const { TextArea } = Input;
const { Option } = Select;

const SkillManagement = () => {
  const navigate = useNavigate();
  const { examId, testId } = useParams();
  const [skills, setSkills] = useState([]);
  const [exams, setExams] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [form] = Form.useForm();
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterSkillType, setFilterSkillType] = useState('');
  const [filterExamId, setFilterExamId] = useState(examId ? parseInt(examId) : '');
  const [filterTestId, setFilterTestId] = useState(testId ? parseInt(testId) : '');

  useEffect(() => {
    const loadData = async () => {
      await fetchExams();
      // Auto-load tests if examId from URL
      if (examId) {
        await fetchTests(parseInt(examId));
      }
      // Fetch skills after exams/tests loaded
      fetchSkills();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Refetch skills when filters change (but not on initial load)
    if (exams.length > 0) {
      fetchSkills();
    }
  }, [searchText, filterSkillType, filterExamId, filterTestId]);

  useEffect(() => {
    if (filterExamId) {
      fetchTests(filterExamId);
    } else {
      setTests([]);
      setFilterTestId('');
    }
  }, [filterExamId]);

  const fetchExams = async () => {
    try {
      const data = await adminService.getExams();
      // Ensure ID is number
      const normalizedData = data.map(exam => ({
        ...exam,
        id: parseInt(exam.id)
      }));
      setExams(normalizedData);
    } catch (error) {
      console.error('Error fetching exams:', error);
      message.error('Tải danh sách bộ đề thất bại');
    }
  };

  const fetchTests = async (examId) => {
    try {
      const data = await adminService.getTestsByExamId(examId);
      // Ensure ID is number
      const normalizedData = data.map(test => ({
        ...test,
        id: parseInt(test.id)
      }));
      setTests(normalizedData);
    } catch (error) {
      console.error('Error fetching tests:', error);
      message.error('Tải danh sách nhóm đề thất bại');
    }
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = {};
      if (searchText) params.search = searchText;
      if (filterSkillType) params.skill_type = filterSkillType;
      if (filterExamId) params.exam_id = filterExamId;
      if (filterTestId) params.exam_test_id = filterTestId;
      
      const data = await adminService.getAllSkills(params);
      
      // Transform API data to UI format
      const transformedSkills = data.map(skill => ({
        id: skill.id,
        name: skill.name,
        skillType: skill.skill_type,
        timeLimit: skill.time_limit,
        description: skill.description,
        image: skill.image,
        isActive: skill.is_active,
        isOnline: skill.is_online,
        examTest: {
          id: skill.exam_test_id,
          name: skill.exam_test_name,
          exam: {
            id: skill.exam_id,
            name: skill.exam_name,
            type: skill.exam_type
          }
        }
      }));
      
      setSkills(transformedSkills);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching skills:', error);
      message.error('Tải danh sách kỹ năng thất bại');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSkills();
  };

  const handleReset = () => {
    setSearchText('');
    setFilterSkillType('');
    setFilterExamId('');
    setFilterTestId('');
    fetchSkills();
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingSkill(null);
    setImageUrl('');
    setIsModalOpen(true);
  };

  const handleEdit = async (skill) => {
    setEditingSkill(skill);
    setImageUrl(skill.image || '');
    
    // Load tests for the exam first
    if (skill.examTest?.exam?.id) {
      await fetchTests(skill.examTest.exam.id);
    }
    
    form.setFieldsValue({
      name: skill.name,
      skillType: skill.skillType,
      timeLimit: skill.timeLimit,
      description: skill.description,
      examId: skill.examTest?.exam?.id,
      examTestId: skill.examTest?.id,
      image: skill.image,
      isActive: skill.isActive,
      isOnline: skill.isOnline
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
      await adminService.deleteSkill(id);
      message.success('Đã xóa kỹ năng thành công');
      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      message.error(error.response?.data?.detail || 'Xóa kỹ năng thất bại');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Transform UI data to API format
      const skillData = {
        exam_test_id: values.examTestId,
        name: values.name,
        skill_type: values.skillType,
        time_limit: values.timeLimit || null,
        description: values.description || null,
        image: values.image || null,
        is_active: values.isActive !== undefined ? values.isActive : true,
        is_online: values.isOnline !== undefined ? values.isOnline : true,
      };
      
      if (editingSkill) {
        // Update - không cần exam_test_id
        delete skillData.exam_test_id;
        await adminService.updateSkill(editingSkill.id, skillData);
        message.success('Đã cập nhật kỹ năng thành công');
      } else {
        // Create
        await adminService.createSkill(skillData);
        message.success('Đã tạo kỹ năng thành công');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchSkills();
    } catch (error) {
      console.error('Error saving skill:', error);
      message.error(error.response?.data?.detail || 'Lưu kỹ năng thất bại');
    }
  };

  const handleViewDetail = (skillId, examId, testId) => {
    navigate(`/admin/skills/${skillId}`, { state: { examId, testId } });
  };

  const handleToggleActive = async (skill) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.toggleSkillActive(skill.id);
      
      setSkills(skills.map(s => 
        s.id === skill.id ? { ...s, isActive: !s.isActive } : s
      ));
      message.success(`Đã ${!skill.isActive ? 'kích hoạt' : 'ẩn'} đề thi`);
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const getSkillTypeColor = (type) => {
    const colors = {
      reading: 'blue',
      writing: 'green',
      listening: 'orange',
      speaking: 'purple'
    };
    return colors[type] || 'default';
  };

  const getExamTypeColor = (type) => {
    const colors = {
      ielts: 'gold',
      toeic: 'cyan',
      online: 'lime'
    };
    return colors[type] || 'default';
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
              <BookOutlined style={{ fontSize: 20 }} />
            </div>
          );
        }
        
        const imageUrl = image.startsWith('http') ? image : `http://localhost:8000${image}`;
        
        return (
          <img
            src={imageUrl}
            alt="Skill"
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
      title: 'Tên đề thi',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Loại',
      dataIndex: 'skillType',
      key: 'skillType',
      render: (type) => (
        <Tag color={getSkillTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Bộ đề thi',
      key: 'exam',
      render: (_, record) => (
        <div>
          {record.examTest?.exam?.name}
          <br />
          <Tag color={getExamTypeColor(record.examTest?.exam?.type)}>
            {record.examTest?.exam?.type?.toUpperCase()}
          </Tag>
        </div>
      )
    },
    {
      title: 'Nhóm đề thi',
      key: 'test',
      render: (_, record) => record.examTest?.name || '-'
    },
    {
      title: 'Thời gian',
      dataIndex: 'timeLimit',
      key: 'timeLimit',
      render: (time) => `${time} phút`
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
            size="small"
            icon={<BookOutlined />}
            onClick={() => handleViewDetail(record.id, record.examTest?.exam?.id, record.examTest?.id)}
          >
            
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              const testUrl = `/exam/full/${record.examTest?.id}/test/${record.skillType}`;
              window.open(testUrl, '_blank');
            }}
          >
          
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
           
          </Button>
          <Popconfirm
            title="Xóa đề thi"
            description="Bạn có chắc chắn muốn xóa? Tất cả sections và câu hỏi sẽ bị xóa!"
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
              
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Filter data based on search and filters
  const filteredSkills = skills.filter(skill => {
    const matchSearch = !searchText || skill.name.toLowerCase().includes(searchText.toLowerCase());
    const matchSkillType = !filterSkillType || skill.skillType === filterSkillType;
    const matchExam = !filterExamId || skill.examTest?.exam?.id === filterExamId;
    const matchTest = !filterTestId || skill.examTest?.id === filterTestId;
    
    return matchSearch && matchSkillType && matchExam && matchTest;
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {examId && testId && (
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/admin/exams/${examId}`)}
            >
              Quay lại
            </Button>
          )}
          <h2 style={{ margin: 0 }}>Quản lý đề thi</h2>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm đề thi mới
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm tên đề thi..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Loại đề thi"
              value={filterSkillType}
              onChange={setFilterSkillType}
              allowClear
            >
              <Option value="reading">Reading</Option>
              <Option value="writing">Writing</Option>
              <Option value="listening">Listening</Option>
              <Option value="speaking">Speaking</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Bộ đề thi"
              value={filterExamId}
              onChange={setFilterExamId}
              allowClear
            >
              {exams.map(exam => (
                <Option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.type.toUpperCase()})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Nhóm đề thi"
              value={filterTestId}
              onChange={setFilterTestId}
              allowClear
              disabled={!filterExamId}
            >
              {tests.map(test => (
                <Option key={test.id} value={test.id}>
                  {test.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Space>
              <Button icon={<SearchOutlined />} onClick={handleSearch}>
                Tìm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Skills Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredSkills}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đề thi`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSkill ? 'Sửa đề thi' : 'Thêm đề thi mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tiêu đề đề thi"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên đề thi!' }]}
          >
            <Input placeholder="VD: IELTS Reading Practice Test 1" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={3} placeholder="Nhập mô tả đề thi..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Loại đề thi"
                name="skillType"
                rules={[{ required: true, message: 'Vui lòng chọn loại đề thi!' }]}
              >
                <Select placeholder="Chọn loại đề thi">
                  <Option value="reading">Reading (Đọc)</Option>
                  <Option value="writing">Writing (Viết)</Option>
                  <Option value="listening">Listening (Nghe)</Option>
                  <Option value="speaking">Speaking (Nói)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Thời gian (phút)"
                name="timeLimit"
                rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="60" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Bộ đề thi"
                name="examId"
                rules={[{ required: true, message: 'Vui lòng chọn bộ đề!' }]}
              >
                <Select 
                  placeholder="Chọn bộ đề"
                  onChange={(value) => {
                    form.setFieldValue('examTestId', undefined);
                    fetchTests(value);
                  }}
                >
                  {exams.map(exam => (
                    <Option key={exam.id} value={exam.id}>
                      {exam.name} ({exam.type.toUpperCase()})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Nhóm đề thi"
                name="examTestId"
                rules={[{ required: true, message: 'Vui lòng chọn nhóm đề!' }]}
              >
                <Select 
                  placeholder="Chọn nhóm đề"
                  disabled={!form.getFieldValue('examId')}
                >
                  {tests.map(test => (
                    <Option key={test.id} value={test.id}>
                      {test.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Hình ảnh"
            name="image"
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
                    src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Hiển thị ngoài giáo trình"
                name="isActive"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chế độ Online"
                name="isOnline"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default SkillManagement;
