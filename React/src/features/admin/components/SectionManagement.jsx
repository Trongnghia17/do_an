import { useState, useEffect } from 'react';
import {
  List,
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
  Card,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import QuestionGroupManagement from './QuestionGroupManagement';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const SectionManagement = ({ skillId }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSections();
  }, [skillId]);

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
            skillId: skillId,
            title: 'Section 1: Passage Reading',
            content: 'Read the following passage and answer questions 1-10',
            contentFormat: 'text',
            audioFile: null,
            isActive: true,
          },
          {
            id: '2',
            skillId: skillId,
            title: 'Section 2: Multiple Choice',
            content: 'Choose the correct answer for questions 11-20',
            contentFormat: 'text',
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
      if (editingSection) {
        // TODO: Replace with actual API call
        // await adminService.updateSection(editingSection.id, values);
        message.success('Section updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createSection(skillId, values);
        message.success('Section created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchSections();
    } catch (error) {
      message.error('Failed to save section');
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h4><FileTextOutlined /> Sections</h4>
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Section
        </Button>
      </div>

      <Collapse size="small" style={{ marginBottom: 16 }}>
        {sections.map((section, index) => (
          <Panel
            key={section.id}
            header={
              <Space>
                <Tag color="cyan">Section {index + 1}</Tag>
                <span>{section.title}</span>
                {section.contentFormat === 'audio' && <Tag color="orange">Audio</Tag>}
                {section.contentFormat === 'video' && <Tag color="red">Video</Tag>}
              </Space>
            }
            extra={
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(section)}
                />
                <Popconfirm
                  title="Delete section"
                  description="Are you sure? This will delete all question groups."
                  onConfirm={() => handleDelete(section.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Space>
            }
          >
            <div style={{ background: '#fff', padding: 12, marginBottom: 12 }}>
              <p style={{ marginBottom: 8 }}><strong>Content:</strong></p>
              <div style={{ 
                padding: 12, 
                background: '#f5f5f5', 
                borderRadius: 4,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {section.content || 'No content'}
              </div>
              {section.audioFile && (
                <p style={{ marginTop: 8 }}>
                  <strong>Audio:</strong> {section.audioFile}
                </p>
              )}
            </div>
            <QuestionGroupManagement sectionId={section.id} />
          </Panel>
        ))}
      </Collapse>

      {sections.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999', background: '#fafafa', borderRadius: 4 }}>
          No sections found. Click "Add Section" to create one.
        </div>
      )}

      <Modal
        title={editingSection ? 'Edit Section' : 'Create Section'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
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
            <Input placeholder="Enter section title" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            tooltip="Main passage or instructions for this section"
          >
            <TextArea rows={6} placeholder="Enter section content (passage, instructions, etc.)" />
          </Form.Item>

          <Form.Item
            name="contentFormat"
            label="Content Format"
            initialValue="text"
          >
            <Select>
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
            <Input placeholder="Enter audio file URL (optional)" />
          </Form.Item>

          <Form.Item
            name="videoFile"
            label="Video File URL"
            tooltip="For video content"
          >
            <Input placeholder="Enter video file URL (optional)" />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Feedback"
            tooltip="Feedback shown after completion"
          >
            <TextArea rows={3} placeholder="Enter feedback (optional)" />
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
