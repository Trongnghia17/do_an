import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ReloadOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const SkillManagement = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [exams, setExams] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form] = Form.useForm();
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterSkillType, setFilterSkillType] = useState('');
  const [filterExamId, setFilterExamId] = useState('');
  const [filterTestId, setFilterTestId] = useState('');

  useEffect(() => {
    fetchExams();
    fetchSkills();
  }, []);

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
      // TODO: Replace with actual API call
      // const response = await adminService.getExams();
      
      // Mock data
      setExams([
        { id: 1, name: 'IELTS Academic', type: 'ielts' },
        { id: 2, name: 'TOEIC Practice', type: 'toeic' },
        { id: 3, name: 'Online English Test', type: 'online' }
      ]);
    } catch (error) {
      message.error('Tải danh sách bộ đề thất bại');
    }
  };

  const fetchTests = async (examId) => {
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getTestsByExam(examId);
      
      // Mock data
      const mockTests = {
        1: [
          { id: 1, name: 'IELTS Academic Test 1' },
          { id: 2, name: 'IELTS Academic Test 2' }
        ],
        2: [
          { id: 3, name: 'TOEIC Test 1' },
          { id: 4, name: 'TOEIC Test 2' }
        ],
        3: [
          { id: 5, name: 'Online Test 1' }
        ]
      };
      
      setTests(mockTests[examId] || []);
    } catch (error) {
      message.error('Tải danh sách nhóm đề thất bại');
    }
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await adminService.getAllSkills({ search, skillType, examId, testId });
      
      // Mock data
      setTimeout(() => {
        setSkills([
          {
            id: 1,
            name: 'IELTS Reading Practice Test 1',
            skillType: 'reading',
            timeLimit: 60,
            isActive: true,
            isOnline: true,
            examTest: {
              id: 1,
              name: 'IELTS Academic Test 1',
              exam: {
                id: 1,
                name: 'IELTS Academic',
                type: 'ielts'
              }
            }
          },
          {
            id: 2,
            name: 'IELTS Writing Task 1 & 2',
            skillType: 'writing',
            timeLimit: 60,
            isActive: true,
            isOnline: false,
            examTest: {
              id: 1,
              name: 'IELTS Academic Test 1',
              exam: {
                id: 1,
                name: 'IELTS Academic',
                type: 'ielts'
              }
            }
          },
          {
            id: 3,
            name: 'IELTS Listening Full Test',
            skillType: 'listening',
            timeLimit: 30,
            isActive: true,
            isOnline: true,
            examTest: {
              id: 1,
              name: 'IELTS Academic Test 1',
              exam: {
                id: 1,
                name: 'IELTS Academic',
                type: 'ielts'
              }
            }
          },
          {
            id: 4,
            name: 'IELTS Speaking Part 1-3',
            skillType: 'speaking',
            timeLimit: 15,
            isActive: false,
            isOnline: false,
            examTest: {
              id: 2,
              name: 'IELTS Academic Test 2',
              exam: {
                id: 1,
                name: 'IELTS Academic',
                type: 'ielts'
              }
            }
          },
          {
            id: 5,
            name: 'TOEIC Reading Comprehension',
            skillType: 'reading',
            timeLimit: 75,
            isActive: true,
            isOnline: true,
            examTest: {
              id: 3,
              name: 'TOEIC Test 1',
              exam: {
                id: 2,
                name: 'TOEIC Practice',
                type: 'toeic'
              }
            }
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Tải danh sách đề thi thất bại');
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
    setIsModalOpen(true);
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    form.setFieldsValue({
      name: skill.name,
      skillType: skill.skillType,
      timeLimit: skill.timeLimit,
      description: skill.description,
      examId: skill.examTest?.exam?.id,
      examTestId: skill.examTest?.id,
      isActive: skill.isActive,
      isOnline: skill.isOnline
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteSkill(id);
      
      setSkills(skills.filter(s => s.id !== id));
      message.success('Đã xóa đề thi thành công');
    } catch (error) {
      message.error('Xóa đề thi thất bại');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingSkill) {
        // Update
        // TODO: Replace with actual API call
        // await adminService.updateSkill(editingSkill.id, values);
        
        setSkills(skills.map(s => 
          s.id === editingSkill.id ? { ...s, ...values } : s
        ));
        message.success('Đã cập nhật đề thi thành công');
      } else {
        // Create
        // TODO: Replace with actual API call
        // const response = await adminService.createSkill(values);
        
        const newSkill = {
          id: Date.now(),
          ...values,
          examTest: {
            id: values.examTestId,
            name: tests.find(t => t.id === values.examTestId)?.name,
            exam: {
              id: values.examId,
              name: exams.find(e => e.id === values.examId)?.name,
              type: exams.find(e => e.id === values.examId)?.type
            }
          }
        };
        setSkills([newSkill, ...skills]);
        message.success('Đã tạo đề thi thành công');
      }
      
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
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
      title: 'Tiêu đề',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Loại',
      dataIndex: 'skillType',
      key: 'skillType',
      width: 120,
      render: (type) => (
        <Tag color={getSkillTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Bộ đề thi',
      key: 'exam',
      width: 200,
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
      width: 200,
      render: (_, record) => record.examTest?.name || '-'
    },
    {
      title: 'Thời gian',
      dataIndex: 'timeLimit',
      key: 'timeLimit',
      width: 100,
      render: (time) => `${time} phút`
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          type={record.isActive ? 'primary' : 'default'}
          onClick={() => handleToggleActive(record)}
        >
          {record.isActive ? 'Hiển thị' : 'Ẩn'}
        </Button>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<BookOutlined />}
            onClick={() => handleViewDetail(record.id, record.examTest?.exam?.id, record.examTest?.id)}
          >
            Xem chi tiết
          </Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              const testUrl = `/exam/full/${record.examTest?.id}/test/${record.skillType}`;
              window.open(testUrl, '_blank');
            }}
          >
            Làm bài
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
              Xóa
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
        <h2 style={{ margin: 0 }}>Quản lý đề thi</h2>
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
      <Card title={`Danh sách đề thi (${filteredSkills.length})`}>
        <Table
          columns={columns}
          dataSource={filteredSkills}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đề thi`
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
            <Upload>
              <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
            </Upload>
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
