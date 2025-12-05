import { useState, useEffect } from 'react';
import {
  List,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tag,
  Badge,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

const QuestionManagement = ({ questionGroupId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchQuestions();
  }, [questionGroupId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getQuestionsByGroupId(questionGroupId);
      
      // Mock data
      setTimeout(() => {
        setQuestions([
          {
            id: '1',
            groupId: questionGroupId,
            content: 'What is the main idea of the passage?',
            answerContent: 'A',
            isCorrect: true,
            point: 1.0,
            feedback: 'Correct! The passage discusses...',
            hint: 'Look at the first paragraph',
            isActive: true,
          },
          {
            id: '2',
            groupId: questionGroupId,
            content: 'According to the author, what is the primary cause?',
            answerContent: 'B',
            isCorrect: false,
            point: 1.0,
            feedback: 'Review paragraph 3',
            isActive: true,
          },
          {
            id: '3',
            groupId: questionGroupId,
            content: 'Which statement is TRUE?',
            answerContent: 'TRUE',
            isCorrect: true,
            point: 1.0,
            isActive: true,
          },
        ]);
        setLoading(false);
      }, 300);
    } catch (error) {
      message.error('Failed to fetch questions');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingQuestion(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // TODO: Replace with actual API call
      // await adminService.deleteQuestion(id);
      
      message.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      message.error('Failed to delete question');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingQuestion) {
        // TODO: Replace with actual API call
        // await adminService.updateQuestion(editingQuestion.id, values);
        message.success('Question updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createQuestion(questionGroupId, values);
        message.success('Question created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchQuestions();
    } catch (error) {
      message.error('Failed to save question');
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge count={questions.length} showZero color="#52c41a">
          <h6 style={{ margin: 0, padding: '4px 8px', background: '#f0f0f0', borderRadius: 4 }}>
            Questions
          </h6>
        </Badge>
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Question
        </Button>
      </div>

      <List
        size="small"
        bordered
        dataSource={questions}
        loading={loading}
        locale={{ emptyText: 'No questions. Click "Add Question" to create.' }}
        renderItem={(item, index) => (
          <List.Item
            key={item.id}
            actions={[
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(item)}
              >
                Edit
              </Button>,
              <Popconfirm
                title="Delete question"
                description="Are you sure?"
                onConfirm={() => handleDelete(item.id)}
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
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: '#1890ff', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 14
                }}>
                  {index + 1}
                </div>
              }
              title={
                <Space>
                  <span style={{ fontSize: 13 }}>{item.content}</span>
                  {item.isCorrect && (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11 }}>
                      Correct Answer
                    </Tag>
                  )}
                  <Tag color="blue" style={{ fontSize: 11 }}>{item.point} pt</Tag>
                </Space>
              }
              description={
                <div style={{ fontSize: 12 }}>
                  <strong>Answer:</strong> {item.answerContent}
                  {item.hint && <div style={{ color: '#888' }}>💡 Hint: {item.hint}</div>}
                </div>
              }
            />
          </List.Item>
        )}
        style={{ background: '#fff' }}
      />

      <Modal
        title={editingQuestion ? 'Edit Question' : 'Create Question'}
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
            name="content"
            label="Question Content"
            rules={[{ required: true, message: 'Please input question content!' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Enter the question text" 
            />
          </Form.Item>

          <Form.Item
            name="answerContent"
            label="Answer Content"
            rules={[{ required: true, message: 'Please input answer!' }]}
            tooltip="The correct answer or expected response"
          >
            <Input placeholder="e.g., A, B, C, or text answer" />
          </Form.Item>

          <Form.Item
            name="point"
            label="Point Value"
            initialValue={1.0}
            rules={[{ required: true, message: 'Please input point value!' }]}
          >
            <InputNumber min={0} max={10} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isCorrect"
            label="Is Correct Answer"
            valuePropName="checked"
            tooltip="Mark if this represents the correct answer for comparison"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="hint"
            label="Hint"
            tooltip="Optional hint for students"
          >
            <Input placeholder="Enter a hint (optional)" />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Feedback"
            tooltip="Feedback shown after answering"
          >
            <TextArea rows={2} placeholder="Enter feedback (optional)" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Image URL"
          >
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          <Form.Item
            name="audioFile"
            label="Audio File URL"
            tooltip="For listening questions"
          >
            <Input placeholder="Enter audio URL (optional)" />
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

export default QuestionManagement;
