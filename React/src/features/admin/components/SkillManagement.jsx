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
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Collapse,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
} from '@ant-design/icons';
import SectionManagement from './SectionManagement';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const SkillManagement = ({ testId, examId }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSkills();
  }, [testId]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getSkillsByTestId(testId);
      
      // Mock data
      setTimeout(() => {
        setSkills([
          {
            id: '1',
            testId: testId,
            skillType: 'reading',
            name: 'Reading',
            description: 'Reading comprehension test',
            timeLimit: 60,
            isActive: true,
            isOnline: true,
          },
          {
            id: '2',
            testId: testId,
            skillType: 'listening',
            name: 'Listening',
            description: 'Listening comprehension test',
            timeLimit: 30,
            isActive: true,
            isOnline: true,
          },
          {
            id: '3',
            testId: testId,
            skillType: 'writing',
            name: 'Writing',
            description: 'Writing tasks',
            timeLimit: 60,
            isActive: true,
            isOnline: false,
          },
          {
            id: '4',
            testId: testId,
            skillType: 'speaking',
            name: 'Speaking',
            description: 'Speaking test',
            timeLimit: 15,
            isActive: true,
            isOnline: false,
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch skills');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSkill(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingSkill(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteSkill(id);
      
      message.success('Skill deleted successfully');
      fetchSkills();
    } catch (error) {
      message.error('Failed to delete skill');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingSkill) {
        // TODO: Replace with actual API call
        // await adminService.updateSkill(editingSkill.id, values);
        message.success('Skill updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createSkill(testId, values);
        message.success('Skill created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchSkills();
    } catch (error) {
      message.error('Failed to save skill');
    }
  };

  const getSkillColor = (skillType) => {
    const colors = {
      reading: 'blue',
      listening: 'green',
      writing: 'orange',
      speaking: 'purple',
    };
    return colors[skillType] || 'default';
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Skills in this Test</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Skill
        </Button>
      </div>

      <Collapse
        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
        style={{ marginBottom: 16 }}
      >
        {skills.map((skill) => (
          <Panel
            key={skill.id}
            header={
              <Space>
                <Tag color={getSkillColor(skill.skillType)}>
                  {skill.skillType.toUpperCase()}
                </Tag>
                <span>{skill.name}</span>
                <Tag color={skill.isActive ? 'green' : 'red'}>
                  {skill.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {skill.isOnline && <Tag color="cyan">Online</Tag>}
                {skill.timeLimit && <Tag>{skill.timeLimit} mins</Tag>}
              </Space>
            }
            extra={
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(skill)}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete skill"
                  description="Are you sure? This will delete all sections and questions."
                  onConfirm={() => handleDelete(skill.id)}
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
            }
          >
            <Card size="small" style={{ background: '#fafafa' }}>
              <p><strong>Description:</strong> {skill.description || 'No description'}</p>
              <SectionManagement skillId={skill.id} />
            </Card>
          </Panel>
        ))}
      </Collapse>

      {skills.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No skills found. Click "Add Skill" to create one.
        </div>
      )}

      <Modal
        title={editingSkill ? 'Edit Skill' : 'Create Skill'}
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
            name="skillType"
            label="Skill Type"
            rules={[{ required: true, message: 'Please select skill type!' }]}
          >
            <Select placeholder="Select skill type">
              <Option value="reading">Reading</Option>
              <Option value="listening">Listening</Option>
              <Option value="writing">Writing</Option>
              <Option value="speaking">Speaking</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Skill Name"
            rules={[{ required: true, message: 'Please input skill name!' }]}
          >
            <Input placeholder="Enter skill name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter skill description" />
          </Form.Item>

          <Form.Item
            name="timeLimit"
            label="Time Limit (minutes)"
          >
            <InputNumber min={1} max={180} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="image"
            label="Image URL"
          >
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          <Form.Item
            name="isOnline"
            label="Is Online"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
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

export default SkillManagement;
