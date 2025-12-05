import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs,
  Card,
  Button,
  Descriptions,
  Space,
  Tag,
  message,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  BookOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import TestManagement from '../components/TestManagement';
import ExamInfo from '../components/ExamInfo';

const { TabPane } = Tabs;

const ExamDetail = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchExamDetail();
  }, [examId]);

  const fetchExamDetail = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getExamById(examId);
      
      // Mock data
      setTimeout(() => {
        setExam({
          id: examId,
          name: 'IELTS Academic Practice Test 1',
          type: 'ielts',
          description: 'Full IELTS Academic test with all 4 skills',
          image: null,
          isActive: true,
          createdAt: '2024-01-01',
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch exam details');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!exam) {
    return <div>Exam not found</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/exams')}
        >
          Back to Exams
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => message.info('Edit exam feature coming soon')}
        >
          Edit Exam
        </Button>
      </Space>

      <Card title={<h2>{exam.name}</h2>} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Type">
            <Tag color="blue">{exam.type.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={exam.isActive ? 'green' : 'red'}>
              {exam.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {exam.createdAt}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {exam.description || 'No description'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Basic Info
              </span>
            }
            key="info"
          >
            <ExamInfo exam={exam} onUpdate={fetchExamDetail} />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BookOutlined />
                Tests
              </span>
            }
            key="tests"
          >
            <TestManagement examId={examId} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ExamDetail;
