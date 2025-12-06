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
import adminService from '../services/adminService';

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
      // Gọi FastAPI endpoint: GET /api/v1/exams/{id}
      const data = await adminService.getExamById(examId);
      
      // Transform data từ FastAPI format sang UI format
      setExam({
        id: data.id,
        name: data.name,
        type: data.type,
        description: data.description,
        image: data.image,
        isActive: data.is_active,
        createdAt: data.created_at,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam details:', error);
      message.error('Tải thông tin bộ đề thất bại: ' + (error.response?.data?.detail || error.message));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (!exam) {
    return <div>Không tìm thấy bộ đề</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/exams')}
        >
          Quay lại
        </Button>
       
      </Space>

    

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Thông tin cơ bản
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
                Nhóm đề thi
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
