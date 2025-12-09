import React, { useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, Space, message, List, Tag, Divider, Spin } from 'antd';
import { RobotOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import './QuickQuestionGenerator.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Trang tạo câu hỏi nhanh bằng AI
 * Cho phép tạo câu hỏi đơn lẻ một cách nhanh chóng
 */
const QuickQuestionGenerator = () => {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([]);
  const { generateQuestions, loading } = useAIGeneration();

  const handleGenerate = async (values) => {
    try {
      const result = await generateQuestions({
        examType: values.examType,
        skill: values.skill,
        topic: values.topic,
        difficulty: values.difficulty,
        numQuestions: values.numQuestions,
        questionTypes: values.questionTypes
      });

      if (result && result.questions) {
        setQuestions(result.questions);
        message.success(`Đã tạo ${result.questions.length} câu hỏi`);
      }
    } catch (error) {
      message.error('Lỗi khi tạo câu hỏi: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCopyQuestion = (question) => {
    const text = `
Câu hỏi: ${question.content}
${question.options ? `\nCác đáp án:\n${question.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n')}` : ''}
${question.correct_answer ? `\nĐáp án đúng: ${question.correct_answer}` : ''}
${question.explanation ? `\nGiải thích: ${question.explanation}` : ''}
    `.trim();

    navigator.clipboard.writeText(text);
    message.success('Đã copy câu hỏi');
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
    message.info('Đã xóa câu hỏi');
  };

  const handleSaveQuestions = () => {
    // TODO: Implement save to database
    message.success('Chức năng lưu vào database sẽ được triển khai');
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'green',
      medium: 'orange',
      hard: 'red'
    };
    return colors[difficulty] || 'default';
  };

  const getQuestionTypeColor = (type) => {
    const colors = {
      multiple_choice: 'blue',
      fill_blank: 'cyan',
      true_false: 'purple',
      short_answer: 'geekblue',
      essay: 'magenta'
    };
    return colors[type] || 'default';
  };

  return (
    <div className="quick-question-generator">
      <div className="page-header">
        <h1>
          <RobotOutlined /> Tạo câu hỏi nhanh bằng AI
        </h1>
        <p>Tạo câu hỏi đơn lẻ một cách nhanh chóng</p>
      </div>

        <div className="content-layout">
          <div className="generator-form">
            <Card title="Cấu hình" className="form-card">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleGenerate}
                initialValues={{
                  examType: 'IELTS',
                  skill: 'Reading',
                  difficulty: 'medium',
                  numQuestions: 5
                }}
              >
                <Form.Item
                  label="Loại đề thi"
                  name="examType"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="IELTS">IELTS</Option>
                    <Option value="TOEIC">TOEIC</Option>
                    <Option value="TOEFL">TOEFL</Option>
                    <Option value="General">General English</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Kỹ năng"
                  name="skill"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="Listening">Listening</Option>
                    <Option value="Reading">Reading</Option>
                    <Option value="Writing">Writing</Option>
                    <Option value="Speaking">Speaking</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Chủ đề"
                  name="topic"
                  rules={[{ required: true, message: 'Vui lòng nhập chủ đề' }]}
                >
                  <Input placeholder="Ví dụ: Environment, Technology, Education..." />
                </Form.Item>

                <Form.Item
                  label="Độ khó"
                  name="difficulty"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="easy">Easy</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="hard">Hard</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Số lượng câu hỏi"
                  name="numQuestions"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label="Loại câu hỏi"
                  name="questionTypes"
                  tooltip="Để trống để AI tự chọn loại câu hỏi phù hợp"
                >
                  <Select mode="multiple" placeholder="Chọn loại câu hỏi (tùy chọn)">
                    <Option value="multiple_choice">Multiple Choice</Option>
                    <Option value="fill_blank">Fill in the Blank</Option>
                    <Option value="true_false">True/False</Option>
                    <Option value="short_answer">Short Answer</Option>
                    <Option value="essay">Essay</Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<RobotOutlined />}
                    loading={loading}
                    block
                    size="large"
                  >
                    Tạo câu hỏi với AI
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>

          <div className="questions-result">
            <Card 
              title={`Câu hỏi đã tạo (${questions.length})`}
              extra={
                questions.length > 0 && (
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveQuestions}
                  >
                    Lưu tất cả
                  </Button>
                )
              }
              className="results-card"
            >
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <p style={{ marginTop: 16 }}>Đang tạo câu hỏi với AI...</p>
                </div>
              )}

              {!loading && questions.length === 0 && (
                <div className="empty-state">
                  <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                  <p>Chưa có câu hỏi nào. Hãy cấu hình và tạo câu hỏi!</p>
                </div>
              )}

              {!loading && questions.length > 0 && (
                <List
                  dataSource={questions}
                  renderItem={(question, index) => (
                    <List.Item
                      key={index}
                      className="question-item"
                      actions={[
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => handleCopyQuestion(question)}
                        >
                          Copy
                        </Button>,
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          Xóa
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div className="question-header">
                            <span className="question-number">Câu {index + 1}</span>
                            <Space>
                              <Tag color={getQuestionTypeColor(question.question_type)}>
                                {question.question_type || 'N/A'}
                              </Tag>
                              {question.metadata?.difficulty && (
                                <Tag color={getDifficultyColor(question.metadata.difficulty)}>
                                  {question.metadata.difficulty.toUpperCase()}
                                </Tag>
                              )}
                              {question.points && (
                                <Tag color="gold">{question.points} điểm</Tag>
                              )}
                            </Space>
                          </div>
                        }
                        description={
                          <div className="question-content">
                            <p className="question-text">{question.content}</p>

                            {question.options && question.options.length > 0 && (
                              <div className="question-options">
                                {question.options.map((option, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className={`option ${option === question.correct_answer ? 'correct-option' : ''}`}
                                  >
                                    <span className="option-label">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span className="option-text">{option}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.correct_answer && (
                              <div className="correct-answer-section">
                                <strong>Đáp án đúng:</strong> {question.correct_answer}
                              </div>
                            )}

                            {question.explanation && (
                              <div className="explanation-section">
                                <strong>Giải thích:</strong> {question.explanation}
                              </div>
                            )}

                            {question.metadata && (
                              <div className="metadata-section">
                                <Space size="small">
                                  {question.metadata.topic && (
                                    <Tag>Topic: {question.metadata.topic}</Tag>
                                  )}
                                  {question.metadata.estimated_time && (
                                    <Tag>Time: {question.metadata.estimated_time}</Tag>
                                  )}
                                </Space>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
  );
};

export default QuickQuestionGenerator;
