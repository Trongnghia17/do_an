import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Descriptions,
  Tag,
  message,
  Spin,
  Tabs,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  BookOutlined,
} from '@ant-design/icons';
import SkillManagement from '../components/SkillManagement';

const { TabPane } = Tabs;

const TestDetail = () => {
  const { examId, testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestDetail();
  }, [testId]);

  const fetchTestDetail = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await adminService.getTestById(testId);
      
      // Mock data
      setTimeout(() => {
        setTest({
          id: testId,
          examId: examId,
          name: 'Academic Test 1',
          description: 'First practice test',
          isActive: true,
          createdAt: '2024-01-01',
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Failed to fetch test details');
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

  if (!test) {
    return <div>Test not found</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/admin/exams/${examId}`)}
        >
          Back to Exam
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => message.info('Edit test feature')}
        >
          Edit Test
        </Button>
      </Space>

      <Card title={<h2>{test.name}</h2>} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Status">
            <Tag color={test.isActive ? 'green' : 'red'}>
              {test.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {test.createdAt}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {test.description || 'No description'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        title="Skills Management"
        extra={
          <Button
            type="primary"
            icon={<BookOutlined />}
            onClick={() => navigate(`/admin/exams/${examId}/tests/${testId}/skills`)}
          >
            Manage Skills
          </Button>
        }
      >
        <p>Click "Manage Skills" to view and edit the 4 skills (Reading, Listening, Writing, Speaking) for this test.</p>
      </Card>
    </div>
  );
};

export default TestDetail;
