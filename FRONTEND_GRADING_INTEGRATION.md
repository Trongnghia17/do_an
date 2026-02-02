# Frontend Integration Guide - AI Grading System

## 📱 React Component Examples

### 1. Writing Grading Component

```jsx
// src/components/ai/AIWritingGrading.jsx
import React, { useState } from 'react';
import { Card, Button, Spin, Alert, Progress, Divider, Tag } from 'antd';
import { CheckCircleOutlined, WarningOutlined, BulbOutlined } from '@ant-design/icons';
import { fastApiClient } from '@/lib/fastapi-client';

const AIWritingGrading = ({ questionId, questionText, studentAnswer }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGrade = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fastApiClient.post('/grading/grade-writing', {
        question_id: questionId,
        question_text: questionText,
        answer: studentAnswer,
        exam_type: 'IELTS',
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to grade writing');
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (score) => {
    if (score >= 8.0) return '#52c41a'; // green
    if (score >= 7.0) return '#1890ff'; // blue
    if (score >= 6.0) return '#faad14'; // orange
    if (score >= 5.0) return '#fa8c16'; // dark orange
    return '#f5222d'; // red
  };

  return (
    <div className="ai-writing-grading">
      <Card title="AI Writing Grading - IELTS" style={{ marginTop: 20 }}>
        <Button 
          type="primary" 
          size="large"
          onClick={handleGrade} 
          loading={loading}
          disabled={!studentAnswer || loading}
        >
          Chấm Điểm Bài Writing
        </Button>

        {error && (
          <Alert 
            type="error" 
            message="Error" 
            description={error} 
            style={{ marginTop: 20 }}
            closable 
          />
        )}

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Spin size="large" />
            <p style={{ marginTop: 20 }}>Đang chấm điểm... Vui lòng đợi...</p>
          </div>
        )}

        {result && !loading && (
          <div className="grading-result" style={{ marginTop: 30 }}>
            {/* Overall Score */}
            <Card 
              style={{ 
                marginBottom: 20, 
                backgroundColor: getBandColor(result.overall_score) + '10',
                borderColor: getBandColor(result.overall_score)
              }}
            >
              <h2 style={{ textAlign: 'center', margin: 0, color: getBandColor(result.overall_score) }}>
                Overall Band Score: {result.overall_score}/9.0
              </h2>
            </Card>

            {/* Criteria Scores */}
            <Card title="📊 Chi Tiết Điểm Theo Tiêu Chí" style={{ marginBottom: 20 }}>
              {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                <div key={criterion} style={{ marginBottom: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {criterion.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <Tag color={getBandColor(score)}>{score}/9.0</Tag>
                  </div>
                  <Progress 
                    percent={(score / 9.0) * 100} 
                    strokeColor={getBandColor(score)}
                    showInfo={false}
                  />
                </div>
              ))}
            </Card>

            {/* Criteria Feedback */}
            {result.criteria_feedback && (
              <Card title="💬 Đánh Giá Chi Tiết Từng Tiêu Chí" style={{ marginBottom: 20 }}>
                {Object.entries(result.criteria_feedback).map(([criterion, feedback]) => (
                  <div key={criterion} style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#1890ff' }}>
                      {criterion.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <p style={{ marginLeft: 20 }}>{feedback}</p>
                    <Divider />
                  </div>
                ))}
              </Card>
            )}

            {/* Strengths */}
            <Card 
              title={<span><CheckCircleOutlined /> Điểm Mạnh</span>}
              style={{ marginBottom: 20 }}
              headStyle={{ backgroundColor: '#f6ffed', color: '#52c41a' }}
            >
              <ul>
                {result.strengths.map((strength, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>{strength}</li>
                ))}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card 
              title={<span><WarningOutlined /> Điểm Yếu</span>}
              style={{ marginBottom: 20 }}
              headStyle={{ backgroundColor: '#fff7e6', color: '#faad14' }}
            >
              <ul>
                {result.weaknesses.map((weakness, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>{weakness}</li>
                ))}
              </ul>
            </Card>

            {/* Suggestions */}
            <Card 
              title={<span><BulbOutlined /> Gợi Ý Cải Thiện</span>}
              style={{ marginBottom: 20 }}
              headStyle={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}
            >
              <ul>
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>{suggestion}</li>
                ))}
              </ul>
            </Card>

            {/* Detailed Feedback */}
            <Card title="📖 Nhận Xét Tổng Quan" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 15, lineHeight: 1.8 }}>{result.detailed_feedback}</p>
            </Card>

            {/* Band Justification */}
            {result.band_justification && (
              <Card title="🎓 Giải Thích Band Score" style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 15, lineHeight: 1.8 }}>{result.band_justification}</p>
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AIWritingGrading;
```

---

### 2. Speaking Grading Component

```jsx
// src/components/ai/AISpeakingGrading.jsx
import React, { useState } from 'react';
import { Card, Button, Spin, Alert, Progress, Divider, Tag, Input } from 'antd';
import { AudioOutlined, CheckCircleOutlined, WarningOutlined, BulbOutlined } from '@ant-design/icons';
import { fastApiClient } from '@/lib/fastapi-client';

const { TextArea } = Input;

const AISpeakingGrading = ({ questionId, questionText }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');

  const handleGrade = async () => {
    if (!transcript.trim()) {
      setError('Vui lòng nhập transcript của câu trả lời');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fastApiClient.post('/grading/grade-speaking', {
        question_id: questionId,
        question_text: questionText,
        transcript: transcript,
        exam_type: 'IELTS',
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to grade speaking');
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (score) => {
    if (score >= 8.0) return '#52c41a';
    if (score >= 7.0) return '#1890ff';
    if (score >= 6.0) return '#faad14';
    if (score >= 5.0) return '#fa8c16';
    return '#f5222d';
  };

  return (
    <div className="ai-speaking-grading">
      <Card title="AI Speaking Grading - IELTS" style={{ marginTop: 20 }}>
        {/* Transcript Input */}
        <Card title={<span><AudioOutlined /> Transcript của câu trả lời</span>} style={{ marginBottom: 20 }}>
          <TextArea
            rows={6}
            placeholder="Nhập hoặc dán transcript của câu trả lời Speaking..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={{ fontSize: 14 }}
          />
          <div style={{ marginTop: 10, color: '#666' }}>
            Word count: {transcript.split(/\s+/).filter(w => w.length > 0).length} words
          </div>
        </Card>

        <Button 
          type="primary" 
          size="large"
          onClick={handleGrade} 
          loading={loading}
          disabled={!transcript.trim() || loading}
        >
          Chấm Điểm Speaking
        </Button>

        {error && (
          <Alert 
            type="error" 
            message="Error" 
            description={error} 
            style={{ marginTop: 20 }}
            closable 
            onClose={() => setError(null)}
          />
        )}

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Spin size="large" />
            <p style={{ marginTop: 20 }}>Đang chấm điểm... Vui lòng đợi...</p>
          </div>
        )}

        {result && !loading && (
          <div className="grading-result" style={{ marginTop: 30 }}>
            {/* Overall Score */}
            <Card 
              style={{ 
                marginBottom: 20, 
                backgroundColor: getBandColor(result.overall_score) + '10',
                borderColor: getBandColor(result.overall_score)
              }}
            >
              <h2 style={{ textAlign: 'center', margin: 0, color: getBandColor(result.overall_score) }}>
                Overall Band Score: {result.overall_score}/9.0
              </h2>
            </Card>

            {/* Criteria Scores */}
            <Card title="📊 Chi Tiết Điểm Theo Tiêu Chí" style={{ marginBottom: 20 }}>
              {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                <div key={criterion} style={{ marginBottom: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {criterion.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <Tag color={getBandColor(score)}>{score}/9.0</Tag>
                  </div>
                  <Progress 
                    percent={(score / 9.0) * 100} 
                    strokeColor={getBandColor(score)}
                    showInfo={false}
                  />
                </div>
              ))}
            </Card>

            {/* Similar structure as Writing for other sections */}
            {/* ... (Copy from Writing component and adjust as needed) */}

            {/* Pronunciation Note */}
            {result.pronunciation_note && (
              <Card title="🔊 Lưu Ý Về Pronunciation" style={{ marginBottom: 20 }}>
                <Alert
                  type="info"
                  message={result.pronunciation_note}
                  showIcon
                />
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AISpeakingGrading;
```

---

### 3. Custom Hook for Grading

```jsx
// src/hooks/useAIGrading.js
import { useState } from 'react';
import { fastApiClient } from '@/lib/fastapi-client';

export const useAIGrading = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gradeWriting = async ({ questionId, questionText, answer, examType = 'IELTS' }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fastApiClient.post('/grading/grade-writing', {
        question_id: questionId,
        question_text: questionText,
        answer: answer,
        exam_type: examType,
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to grade writing';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const gradeSpeaking = async ({ questionId, questionText, transcript, examType = 'IELTS' }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fastApiClient.post('/grading/grade-speaking', {
        question_id: questionId,
        question_text: questionText,
        transcript: transcript,
        exam_type: examType,
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to grade speaking';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    gradeWriting,
    gradeSpeaking,
  };
};
```

---

### 4. Usage Example in Exam Page

```jsx
// src/features/user/exams/ExamTakingPage.jsx
import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import AIWritingGrading from '@/components/ai/AIWritingGrading';
import AISpeakingGrading from '@/components/ai/AISpeakingGrading';

const ExamTakingPage = () => {
  const [showWritingGrading, setShowWritingGrading] = useState(false);
  const [showSpeakingGrading, setShowSpeakingGrading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');

  // ... other exam logic

  return (
    <div>
      {/* Writing Question */}
      {currentQuestion.type === 'essay' && (
        <>
          <textarea 
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Write your essay here..."
          />
          
          <Button onClick={() => setShowWritingGrading(true)}>
            Chấm Điểm Bài Writing
          </Button>

          <Modal
            title="AI Writing Grading"
            open={showWritingGrading}
            onCancel={() => setShowWritingGrading(false)}
            footer={null}
            width={1000}
          >
            <AIWritingGrading
              questionId={currentQuestion.id}
              questionText={currentQuestion.content}
              studentAnswer={currentAnswer}
            />
          </Modal>
        </>
      )}

      {/* Speaking Question */}
      {currentQuestion.type === 'speaking' && (
        <>
          <Button onClick={() => setShowSpeakingGrading(true)}>
            Chấm Điểm Speaking
          </Button>

          <Modal
            title="AI Speaking Grading"
            open={showSpeakingGrading}
            onCancel={() => setShowSpeakingGrading(false)}
            footer={null}
            width={1000}
          >
            <AISpeakingGrading
              questionId={currentQuestion.id}
              questionText={currentQuestion.content}
            />
          </Modal>
        </>
      )}
    </div>
  );
};

export default ExamTakingPage;
```

---

## 🎨 Styling

```css
/* src/components/ai/AIGrading.css */
.ai-writing-grading,
.ai-speaking-grading {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

.grading-result h2 {
  font-size: 32px;
  font-weight: bold;
}

.grading-result h3 {
  font-size: 20px;
  margin-top: 20px;
  color: #1890ff;
}

.grading-result h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.grading-result ul {
  list-style-type: none;
  padding-left: 0;
}

.grading-result ul li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
}

.grading-result ul li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #1890ff;
  font-weight: bold;
  font-size: 20px;
}

.ant-progress-text {
  font-weight: bold !important;
}
```

---

## 📦 Required Dependencies

```bash
# In React project directory
npm install axios
npm install antd
npm install @ant-design/icons
```

---

## 🔧 FastAPI Client Setup

```javascript
// src/lib/fastapi-client.js
import axios from 'axios';

export const fastApiClient = axios.create({
  baseURL: import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
fastApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

---

## 🌍 Environment Variables

```env
# React/.env
VITE_FASTAPI_URL=http://localhost:8000/api/v1
```

---

## 📝 Notes

1. **Authentication**: Đảm bảo user đã login trước khi gọi API grading
2. **Loading State**: Hiển thị loading spinner khi đang chấm điểm (thường mất 5-15 giây)
3. **Error Handling**: Xử lý lỗi network và API errors
4. **Responsive**: Components should work on mobile and desktop
5. **Word Count**: Hiển thị số từ cho writing/speaking để user biết

---

## 🚀 Next Steps

1. Integrate components vào exam pages
2. Add loading animations
3. Add export PDF functionality cho kết quả
4. Add comparison với previous attempts
5. Add teacher override functionality

---

**Last Updated**: 2026-02-01
