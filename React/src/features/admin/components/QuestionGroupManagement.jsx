import { useState, useEffect } from 'react';
import {
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
  Collapse,
  List,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import QuestionManagement from './QuestionManagement';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const QuestionGroupManagement = ({ sectionId }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchGroups();
  }, [sectionId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getQuestionGroupsBySectionId(sectionId);
      
      // Mock data
      setTimeout(() => {
        setGroups([
          {
            id: '1',
            sectionId: sectionId,
            content: 'Questions 1-5: Choose the correct answer',
            questionType: 'multiple_choice',
            answerLayout: 'standard',
            instructions: 'Select one option for each question',
            isActive: true,
          },
          {
            id: '2',
            sectionId: sectionId,
            content: 'Questions 6-10: True/False/Not Given',
            questionType: 'true_false_not_given',
            answerLayout: 'inline',
            instructions: 'Answer TRUE, FALSE, or NOT GIVEN',
            isActive: true,
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch question groups');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingGroup(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteQuestionGroup(id);
      
      message.success('Question group deleted successfully');
      fetchGroups();
    } catch (error) {
      message.error('Failed to delete question group');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingGroup) {
        // TODO: Replace with actual API call
        // await adminService.updateQuestionGroup(editingGroup.id, values);
        message.success('Question group updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createQuestionGroup(sectionId, values);
        message.success('Question group created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchGroups();
    } catch (error) {
      message.error('Failed to save question group');
    }
  };

  const questionTypeColors = {
    multiple_choice: 'blue',
    yes_no_not_given: 'green',
    true_false_not_given: 'orange',
    short_text: 'purple',
    fill_in_blank: 'cyan',
    matching: 'magenta',
    essay: 'red',
    speaking: 'volcano',
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h5><QuestionCircleOutlined /> Question Groups</h5>
        <Button
          size="small"
          type="primary"
          ghost
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Group
        </Button>
      </div>

      <Collapse size="small" accordion>
        {groups.map((group, index) => (
          <Panel
            key={group.id}
            header={
              <Space>
                <Tag color="purple">Group {index + 1}</Tag>
                <Tag color={questionTypeColors[group.questionType]}>
                  {group.questionType.replace(/_/g, ' ').toUpperCase()}
                </Tag>
                <span style={{ fontSize: 12 }}>{group.content?.substring(0, 40)}...</span>
              </Space>
            }
            extra={
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(group)}
                />
                <Popconfirm
                  title="Delete question group"
                  description="This will delete all questions in this group."
                  onConfirm={() => handleDelete(group.id)}
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
            <div style={{ background: '#fff', padding: 8, marginBottom: 12, borderRadius: 4, border: '1px solid #f0f0f0' }}>
              <p style={{ marginBottom: 4, fontSize: 12 }}><strong>Instructions:</strong> {group.instructions || 'No instructions'}</p>
              <p style={{ marginBottom: 4, fontSize: 12 }}><strong>Answer Layout:</strong> {group.answerLayout}</p>
              {group.content && (
                <div style={{ 
                  padding: 8, 
                  background: '#fafafa', 
                  borderRadius: 4,
                  fontSize: 12,
                  marginTop: 8,
                  maxHeight: 100,
                  overflow: 'auto'
                }}>
                  {group.content}
                </div>
              )}
            </div>
            <QuestionManagement questionGroupId={group.id} />
          </Panel>
        ))}
      </Collapse>

      {groups.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          color: '#999', 
          background: '#f9f9f9', 
          borderRadius: 4,
          fontSize: 12
        }}>
          No question groups. Click "Add Group" to create one.
        </div>
      )}

      <Modal
        title={editingGroup ? 'Edit Question Group' : 'Create Question Group'}
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
            name="questionType"
            label="Question Type"
            rules={[{ required: true, message: 'Please select question type!' }]}
          >
            <Select placeholder="Select question type">
              <Option value="multiple_choice">Multiple Choice</Option>
              <Option value="yes_no_not_given">Yes/No/Not Given</Option>
              <Option value="true_false_not_given">True/False/Not Given</Option>
              <Option value="short_text">Short Text</Option>
              <Option value="fill_in_blank">Fill in the Blank</Option>
              <Option value="matching">Matching</Option>
              <Option value="table_selection">Table Selection</Option>
              <Option value="essay">Essay</Option>
              <Option value="speaking">Speaking</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="Group Content"
            tooltip="Shared content or passage for all questions in this group"
          >
            <TextArea rows={4} placeholder="Enter group content (optional)" />
          </Form.Item>

          <Form.Item
            name="instructions"
            label="Instructions"
            rules={[{ required: true, message: 'Please input instructions!' }]}
          >
            <TextArea rows={2} placeholder="e.g., Choose the correct answer" />
          </Form.Item>

          <Form.Item
            name="answerLayout"
            label="Answer Layout"
            initialValue="standard"
          >
            <Select>
              <Option value="standard">Standard</Option>
              <Option value="inline">Inline</Option>
              <Option value="side_by_side">Side by Side</Option>
              <Option value="drag_drop">Drag & Drop</Option>
            </Select>
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

export default QuestionGroupManagement;
