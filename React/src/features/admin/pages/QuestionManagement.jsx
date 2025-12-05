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
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tag,
  Spin,
  Image,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

const QuestionManagement = () => {
  const { skillId, sectionId, groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchGroupInfo();
    fetchQuestions();
  }, [groupId]);

  const fetchGroupInfo = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getQuestionGroupById(groupId);
      
      // Mock data
      setGroup({
        id: groupId,
        content: 'Questions 1-5: Choose the correct answer',
        questionType: 'multiple_choice',
      });
    } catch (error) {
      message.error('Failed to fetch group info');
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getQuestionsByGroupId(groupId);
      
      // Mock data
      setTimeout(() => {
        setQuestions([
          {
            id: '1',
            examQuestionGroupId: groupId,
            content: 'What is the main idea of the passage?',
            answerContent: JSON.stringify([
              { key: 'A', text: 'The history of technology' },
              { key: 'B', text: 'The impact of social media', is_correct: true },
              { key: 'C', text: 'The future of communication' },
              { key: 'D', text: 'The evolution of internet' },
            ]),
            isCorrect: false,
            point: 1.0,
            feedback: 'The passage mainly discusses how social media has changed communication.',
            hint: 'Look at the second paragraph',
            image: null,
            audioFile: null,
            isActive: true,
          },
          {
            id: '2',
            examQuestionGroupId: groupId,
            content: 'According to the author, what is the biggest challenge?',
            answerContent: JSON.stringify([
              { key: 'A', text: 'Privacy concerns', is_correct: true },
              { key: 'B', text: 'Technical limitations' },
              { key: 'C', text: 'Cost factors' },
              { key: 'D', text: 'User adoption' },
            ]),
            isCorrect: false,
            point: 1.0,
            feedback: 'The author mentions privacy as the primary concern.',
            hint: null,
            image: null,
            audioFile: null,
            isActive: true,
          },
        ]);
        setLoading(false);
      }, 500);
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
    form.setFieldsValue({
      ...record,
      answerContent: typeof record.answerContent === 'string' 
        ? record.answerContent 
        : JSON.stringify(record.answerContent, null, 2),
    });
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
      const payload = {
        ...values,
        examQuestionGroupId: groupId,
      };

      if (editingQuestion) {
        // TODO: Replace with actual API call
        // await adminService.updateQuestion(editingQuestion.id, payload);
        message.success('Question updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createQuestion(payload);
        message.success('Question created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchQuestions();
    } catch (error) {
      message.error('Failed to save question');
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Question Content',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: 'Point',
      dataIndex: 'point',
      key: 'point',
      width: 80,
      render: (point) => <Tag color="blue">{point}</Tag>,
    },
    {
      title: 'Has Image',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image) => image ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: '#ccc' }} />,
    },
    {
      title: 'Has Audio',
      dataIndex: 'audioFile',
      key: 'audioFile',
      width: 100,
      render: (audio) => audio ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: '#ccc' }} />,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete question"
            description="Are you sure you want to delete this question?"
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

  if (!group) {
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
            onClick={() => navigate(`/admin/skills/${skillId}/sections/${sectionId}/groups`)}
          >
            Back to Question Groups
          </Button>
        </Space>
      </div>

      <Card 
        title={
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              Questions Management
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              {group.content}
            </div>
            <Tag color="blue" style={{ marginTop: 8 }}>
              {group.questionType?.replace(/_/g, ' ').toUpperCase()}
            </Tag>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Add Question
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={questions}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} questions`,
          }}
        />
      </Card>

      <Modal
        title={editingQuestion ? 'Edit Question' : 'Create Question'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
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
              rows={4} 
              placeholder="Enter the question text" 
            />
          </Form.Item>

          <Form.Item
            name="answerContent"
            label="Answer Content"
            tooltip="For multiple choice: JSON array of options. For other types: the correct answer text"
            rules={[{ required: true, message: 'Please input answer content!' }]}
          >
            <TextArea 
              rows={8} 
              placeholder={`For multiple choice, use JSON format:
[
  { "key": "A", "text": "Option A", "is_correct": false },
  { "key": "B", "text": "Option B", "is_correct": true },
  { "key": "C", "text": "Option C", "is_correct": false },
  { "key": "D", "text": "Option D", "is_correct": false }
]

For other types: Enter the correct answer text`}
            />
          </Form.Item>

          <Form.Item
            name="point"
            label="Point Value"
            rules={[{ required: true, message: 'Please input point value!' }]}
            initialValue={1.0}
          >
            <InputNumber 
              min={0.1} 
              max={10} 
              step={0.1} 
              style={{ width: '100%' }} 
            />
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Feedback/Explanation"
            tooltip="Shown to students after they answer"
          >
            <TextArea rows={3} placeholder="Enter feedback or explanation" />
          </Form.Item>

          <Form.Item
            name="hint"
            label="Hint"
            tooltip="Optional hint for students"
          >
            <Input placeholder="Enter a hint (optional)" />
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
          >
            <Input placeholder="Enter audio file URL (optional)" />
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
