import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Descriptions,
  message,
  Spin,
  Tabs,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Popconfirm,
  Upload
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  BookOutlined,
  UploadOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const SkillDetail = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState(null);
  const [sections, setSections] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [form] = Form.useForm();
  
  // Get examId and testId from state if passed from navigation
  const { examId, testId } = location.state || {};

  useEffect(() => {
    fetchSkillDetail();
  }, [skillId]);

  const fetchSkillDetail = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await adminService.getSkillById(skillId);
      
      // Mock data
      setTimeout(() => {
        setSkill({
          id: parseInt(skillId),
          name: 'IELTS Reading Practice Test 1',
          skillType: 'reading',
          description: 'Academic Reading test with 3 passages',
          timeLimit: 60,
          examTest: {
            id: testId || 1,
            name: 'IELTS Academic Test 1',
            exam: {
              id: examId || 1,
              name: 'IELTS Academic',
              type: 'ielts'
            }
          },
          isActive: true,
          image: null
        });

        setSections([
          {
            id: 1,
            name: 'Phần 1',
            content: 'Lịch sử của Sô-cô-la...',
            contentFormat: 'text',
            orderIndex: 1,
            audioFile: null,
            videoFile: null,
            questionGroupsCount: 3
          },
          {
            id: 2,
            name: 'Phần 2',
            content: 'Biến đổi khí hậu và ảnh hưởng...',
            contentFormat: 'text',
            orderIndex: 2,
            audioFile: null,
            videoFile: null,
            questionGroupsCount: 2
          },
          {
            id: 3,
            name: 'Phần 3',
            content: 'Tương lai của công nghệ...',
            contentFormat: 'text',
            orderIndex: 3,
            audioFile: null,
            videoFile: null,
            questionGroupsCount: 4
          }
        ]);

        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Tải thông tin đề thi thất bại');
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    form.resetFields();
    setEditingSection(null);
    setIsModalVisible(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    form.setFieldsValue({
      name: section.name,
      content: section.content,
      contentFormat: section.contentFormat,
      orderIndex: section.orderIndex,
      feedback: section.feedback
    });
    setIsModalVisible(true);
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteSection(sectionId);
      
      setSections(sections.filter(s => s.id !== sectionId));
      message.success('Đã xóa phần thành công');
    } catch (error) {
      message.error('Xóa phần thất bại');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingSection) {
        // Update section
        // TODO: Replace with actual API call
        // await adminService.updateSection(editingSection.id, values);
        
        setSections(sections.map(s => 
          s.id === editingSection.id ? { ...s, ...values } : s
        ));
        message.success('Đã cập nhật phần thành công');
      } else {
        // Create section
        // TODO: Replace with actual API call
        // const response = await adminService.createSection(skillId, values);
        
        const newSection = {
          id: Date.now(),
          ...values,
          questionGroupsCount: 0
        };
        setSections([...sections, newSection]);
        message.success('Đã tạo phần thành công');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleManageQuestionGroups = (sectionId) => {
    navigate(`/admin/skills/${skillId}/sections/${sectionId}/groups`);
  };

  const handleTakeTest = () => {
    const actualTestId = testId || skill?.examTest?.id;
    const testUrl = `/exam/full/${actualTestId}/test/${skill.skillType}`;
    window.open(testUrl, '_blank');
  };

  const sectionColumns = [
    {
      title: 'Thứ tự',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 80,
      sorter: (a, b) => a.orderIndex - b.orderIndex
    },
    {
      title: 'Tên phần',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Định dạng',
      dataIndex: 'contentFormat',
      key: 'contentFormat',
      width: 150,
      render: (format) => {
        const colors = {
          text: 'blue',
          audio: 'green',
          video: 'purple',
          image: 'orange'
        };
        const labels = {
          text: 'VĂN BẢN',
          audio: 'ÂM THANH',
          video: 'VIDEO',
          image: 'HÌNH ẢNH'
        };
        return <Tag color={colors[format]}>{labels[format]}</Tag>;
      }
    },
    {
      title: 'Nhóm câu hỏi',
      dataIndex: 'questionGroupsCount',
      key: 'questionGroupsCount',
      width: 150,
      render: (count) => <Tag>{count} nhóm</Tag>
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<BookOutlined />}
            onClick={() => handleManageQuestionGroups(record.id)}
          >
            Nhóm câu hỏi
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSection(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa phần"
            description="Bạn có chắc chắn? Tất cả nhóm câu hỏi sẽ bị xóa!"
            onConfirm={() => handleDeleteSection(record.id)}
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!skill) {
    return <div>Không tìm thấy đề thi</div>;
  }

  const tabItems = [
    {
      key: 'info',
      label: 'Thông tin đề thi',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Tên đề thi" span={2}>
            {skill.name}
          </Descriptions.Item>
          <Descriptions.Item label="Loại đề thi">
            <Tag color="blue">{skill.skillType.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {skill.timeLimit} phút
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={skill.isActive ? 'green' : 'red'}>
              {skill.isActive ? 'Hiển thị' : 'Ẩn'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Bộ đề">
            {skill.examTest?.exam?.name} ({skill.examTest?.exam?.type})
          </Descriptions.Item>
          <Descriptions.Item label="Nhóm đề">
            {skill.examTest?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {skill.description || 'Không có mô tả'}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'sections',
      label: `Các phần (${sections.length})`,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSection}>
              Thêm phần
            </Button>
          </div>
          <Table
            columns={sectionColumns}
            dataSource={sections}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <h2 style={{ margin: 0 }}>Chi tiết đề thi: {skill.name}</h2>
        </Space>
        <Space>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleTakeTest}
          >
            Làm bài
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              // Open edit modal or navigate to edit page
              message.info('Chức năng sửa sẽ được thêm vào');
            }}
          >
            Sửa thông tin
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>

      <Modal
        title={editingSection ? 'Sửa phần' : 'Thêm phần'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên phần"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên phần!' }]}
          >
            <Input placeholder="VD: Phần 1, Đoạn văn 1" />
          </Form.Item>

          <Form.Item
            label="Nội dung"
            name="content"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
          >
            <TextArea rows={6} placeholder="Nhập nội dung phần..." />
          </Form.Item>

          <Form.Item
            label="Định dạng nội dung"
            name="contentFormat"
            initialValue="text"
            rules={[{ required: true, message: 'Vui lòng chọn định dạng!' }]}
          >
            <Select>
              <Option value="text">Văn bản</Option>
              <Option value="audio">Âm thanh</Option>
              <Option value="video">Video</Option>
              <Option value="image">Hình ảnh</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Thứ tự"
            name="orderIndex"
            rules={[{ required: true, message: 'Vui lòng nhập thứ tự!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Phản hồi (Tùy chọn)"
            name="feedback"
          >
            <TextArea rows={3} placeholder="Phản hồi sau khi hoàn thành phần..." />
          </Form.Item>

          <Form.Item
            label="File âm thanh"
            name="audioFile"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Tải lên âm thanh</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="File video"
            name="videoFile"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Tải lên video</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SkillDetail;
