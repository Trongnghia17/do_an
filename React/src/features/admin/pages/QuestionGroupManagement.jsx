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
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const QuestionGroupManagement = () => {
  const { skillId, sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSectionInfo();
    fetchGroups();
  }, [sectionId]);

  const fetchSectionInfo = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getSectionById(sectionId);
      
      // Mock data
      setSection({
        id: sectionId,
        title: 'Part 1: Multiple Choice',
      });
    } catch (error) {
      message.error('Tải thông tin phần thất bại');
    }
  };

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
            examSectionId: sectionId,
            content: 'Questions 1-5: Choose the correct answer A, B, C or D',
            questionType: 'multiple_choice',
            answerLayout: 'standard',
            instructions: 'Select one option for each question',
            isActive: true,
          },
          {
            id: '2',
            examSectionId: sectionId,
            content: 'Questions 6-10: Answer TRUE, FALSE, or NOT GIVEN',
            questionType: 'true_false_not_given',
            answerLayout: 'inline',
            instructions: 'Write TRUE if the statement agrees with the information, FALSE if it contradicts, NOT GIVEN if there is no information',
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
      const payload = {
        ...values,
        examSectionId: sectionId,
      };

      if (editingGroup) {
        // TODO: Replace with actual API call
        // await adminService.updateQuestionGroup(editingGroup.id, payload);
        message.success('Question group updated successfully');
      } else {
        // TODO: Replace with actual API call
        // await adminService.createQuestionGroup(payload);
        message.success('Question group created successfully');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchGroups();
    } catch (error) {
      message.error('Failed to save question group');
    }
  };

  const handleManageQuestions = (groupId) => {
    navigate(`/admin/skills/${skillId}/sections/${sectionId}/groups/${groupId}/questions`);
  };

  const columns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: 'Question Type',
      dataIndex: 'questionType',
      key: 'questionType',
      render: (type) => {
        const colors = {
          multiple_choice: 'blue',
          yes_no_not_given: 'green',
          true_false_not_given: 'orange',
          short_text: 'purple',
          fill_in_blank: 'cyan',
          matching: 'magenta',
          table_selection: 'gold',
          essay: 'red',
          speaking: 'volcano',
        };
        return <Tag color={colors[type]}>{type.replace(/_/g, ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Answer Layout',
      dataIndex: 'answerLayout',
      key: 'answerLayout',
      render: (layout) => (
        <Tag>{layout.replace(/_/g, ' ')}</Tag>
      ),
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
            icon={<QuestionCircleOutlined />}
            onClick={() => handleManageQuestions(record.id)}
          >
            Questions
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
            title="Delete question group"
            description="Are you sure? All questions will be deleted!"
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

  if (!section) {
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
            onClick={() => navigate(`/admin/skills/${skillId}`)}
          >
            Back to Skill
          </Button>
        </Space>
      </div>

      <Card 
        title={
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              {section.title} - Question Groups
            </div>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Add Question Group
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={groups}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingGroup ? 'Edit Question Group' : 'Create Question Group'}
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
            name="content"
            label="Group Content"
            tooltip="Introduction or shared content for this group of questions"
          >
            <TextArea 
              rows={4} 
              placeholder="e.g., Questions 1-5: Read the passage and choose the correct answer" 
            />
          </Form.Item>

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
            name="answerLayout"
            label="Answer Layout"
            rules={[{ required: true, message: 'Please select answer layout!' }]}
          >
            <Select placeholder="Select answer layout">
              <Option value="inline">Inline (within content)</Option>
              <Option value="side_by_side">Side by Side</Option>
              <Option value="drag_drop">Drag & Drop</Option>
              <Option value="standard">Standard (question then answer)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="instructions"
            label="Instructions"
          >
            <TextArea rows={3} placeholder="Enter instructions for students" />
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
