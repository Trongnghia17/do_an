import React, { useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, Space, message, List, Tag } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * Test page - tạo câu hỏi nhanh
 */
const TestQuickGenerator = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (values) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setQuestions([
        {
          content: "What is the capital of France?",
          question_type: "multiple_choice",
          options: ["London", "Paris", "Berlin", "Madrid"],
          correct_answer: "Paris",
          explanation: "Paris is the capital and largest city of France."
        }
      ]);
      setLoading(false);
      message.success('Generated 1 question');
    }, 1000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1><RobotOutlined /> Test Quick Generator</h1>
      
      <Card title="Configuration" style={{ marginBottom: 16 }}>
        <Form onFinish={handleGenerate} layout="vertical">
          <Form.Item label="Topic" name="topic" rules={[{ required: true }]}>
            <Input placeholder="Enter topic" />
          </Form.Item>
          
          <Form.Item label="Difficulty" name="difficulty" initialValue="medium">
            <Select>
              <Option value="easy">Easy</Option>
              <Option value="medium">Medium</Option>
              <Option value="hard">Hard</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Number of Questions" name="num" initialValue={5}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" loading={loading} block>
            Generate Questions
          </Button>
        </Form>
      </Card>
      
      {questions.length > 0 && (
        <Card title="Results">
          <List
            dataSource={questions}
            renderItem={(q, idx) => (
              <List.Item key={idx}>
                <List.Item.Meta
                  title={`Question ${idx + 1}: ${q.content}`}
                  description={
                    <div>
                      <Tag color="blue">{q.question_type}</Tag>
                      <div style={{ marginTop: 8 }}>
                        {q.options?.map((opt, i) => (
                          <div key={i} style={{ 
                            padding: '4px 8px', 
                            background: opt === q.correct_answer ? '#d4edda' : '#f8f9fa',
                            margin: '4px 0',
                            borderRadius: '4px'
                          }}>
                            {opt}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default TestQuickGenerator;
