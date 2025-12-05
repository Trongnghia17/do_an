import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Upload,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UnorderedListOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const SectionManagement = () => {
  const { examId, testId, skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSkillInfo();
    fetchSections();
  }, [skillId]);

  const fetchSkillInfo = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getSkillById(skillId);
      
      // Mock data
      setSkill({
        id: skillId,
        name: 'Academic Reading',
        skillType: 'reading',
      });
    } catch (error) {
      message.error('Failed to fetch skill info');
    }
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getSectionsBySkillId(skillId);
      
      // Mock data
      setTimeout(() => {
        setSections([
          {
            id: '1',
            examSkillId: skillId,
            title: 'Part 1: Multiple Choice',
            content: 'Read the passage and answer questions 1-13',
            contentFormat: 'text',
            audioFile: null,
            videoFile: null,
            feedback: null,
            isActive: true,
          },
          {
            id: '2',
            examSkillId: skillId,
            title: 'Part 2: True/False/Not Given',
            content: 'Read the passage and answer questions 14-26',
            contentFormat: 'text',
            audioFile: null,
            videoFile: null,
            feedback: null,
            isActive: true,
          },
          {
            id: '3',
            examSkillId: skillId,
            title: 'Part 3: Matching Headings',
            content: 'Match the headings to the paragraphs (questions 27-40)',
            contentFormat: 'text',
            audioFile: null,
            videoFile: null,
            feedback: null,
            isActive: true,
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch sections');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSection(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingSection(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteSection(id);
      
      message.success('Section deleted successfully');
      fetchSections();
    } catch (error) {
      message.error('Failed to delete section');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        examSkillId: skillId,
      };

      if (editingSection) {
        // TODO: Replace with actual API call
        // await adminService.updateSection(editingSection.id, payload);
        message.success('Section updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createSection(payload);
        message.success('Section created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchSections();
    } catch (error) {
      message.error('Failed to save section');
    }
  };

  const handleManageQuestionGroups = (sectionId) => {
    navigate(`/admin/exams/${examId}/tests/${testId}/skills/${skillId}/sections/${sectionId}/groups`);
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Content Format',
      dataIndex: 'contentFormat',
      key: 'contentFormat',
      render: (format) => {
        const colors = {
          text: 'blue',
          audio: 'green',
          video: 'orange',
          image: 'purple',
        };
        return <Tag color={colors[format]}>{format.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Has Audio',
      dataIndex: 'audioFile',
      key: 'audioFile',
      render: (file) => file ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Has Video',
      dataIndex: 'videoFile',
      key: 'videoFile',
      render: (file) => file ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => handleManageQuestionGroups(record.id)}
          >
            Question Groups
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
            title="Delete section"
            description="Are you sure? All question groups will be deleted!"
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

  if (!skill) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/admin/exams/${examId}/tests/${testId}/skills`)}
          >
            Back to Skills
          </Button>
        </Space>
      </div>

      <Card 
        title={
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              {skill.name} - Sections Management
            </div>
            <Tag color="blue">{skill.skillType?.toUpperCase()}</Tag>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Add Section
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={sections}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingSection ? 'Edit Section' : 'Create Section'}
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
            name="title"
            label="Section Title"
            rules={[{ required: true, message: 'Please input section title!' }]}
          >
            <Input placeholder="e.g., Part 1: Multiple Choice" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            tooltip="Main content/passage for this section"
          >
            <TextArea 
              rows={8} 
              placeholder="Enter section content (passage, instructions, etc.)" 
            />
          </Form.Item>

          <Form.Item
            name="contentFormat"
            label="Content Format"
            rules={[{ required: true, message: 'Please select content format!' }]}
          >
            <Select placeholder="Select content format">
              <Option value="text">Text</Option>
              <Option value="audio">Audio</Option>
              <Option value="video">Video</Option>
              <Option value="image">Image</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="audioFile"
            label="Audio File URL"
            tooltip="For listening sections"
          >
            <Input placeholder="Enter audio file URL" />
          </Form.Item>

          <Form.Item
            name="videoFile"
            label="Video File URL"
            tooltip="For video-based sections"
          >
            <Input placeholder="Enter video file URL" />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Feedback/Instructions"
          >
            <TextArea rows={3} placeholder="Enter feedback or instructions" />
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

export default SectionManagement;
