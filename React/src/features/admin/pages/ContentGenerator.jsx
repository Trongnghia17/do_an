import React, { useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, Space, message, Divider, Spin } from 'antd';
import { FileTextOutlined, CopyOutlined, SaveOutlined, RedoOutlined } from '@ant-design/icons';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import './ContentGenerator.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Trang tạo nội dung (passages, dialogues, scenarios) bằng AI
 */
const ContentGenerator = () => {
  const [form] = Form.useForm();
  const [generatedContent, setGeneratedContent] = useState(null);
  const { generateContent, loading } = useAIGeneration();

  const handleGenerate = async (values) => {
    try {
      const result = await generateContent({
        contentType: values.contentType,
        skill: values.skill,
        topic: values.topic,
        difficulty: values.difficulty,
        wordCount: values.wordCount
      });

      if (result && result.content) {
        setGeneratedContent({
          content: result.content,
          metadata: result.metadata
        });
        message.success('Đã tạo nội dung thành công');
      }
    } catch (error) {
      message.error('Lỗi khi tạo nội dung: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      message.success('Đã copy nội dung');
    }
  };

  const handleSave = () => {
    // TODO: Implement save to database
    message.success('Chức năng lưu sẽ được triển khai');
  };

  const handleReset = () => {
    setGeneratedContent(null);
    form.resetFields();
  };

  const contentTypeExamples = {
    passage: 'Reading passage cho bài thi Reading',
    dialogue: 'Đoạn hội thoại cho bài thi Listening',
    scenario: 'Tình huống cho bài thi Speaking',
    prompt: 'Đề bài cho bài thi Writing',
    story: 'Câu chuyện ngắn cho học tập'
  };

  return (
    <div className="content-generator">
      <div className="page-header">
        <h1>
          <FileTextOutlined /> Tạo nội dung bằng AI
        </h1>
        <p>Tạo passages, dialogues, scenarios và nhiều loại nội dung khác</p>
      </div>

        <div className="generator-layout">
          <div className="generator-form-section">
            <Card title="Cấu hình nội dung" className="config-card">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleGenerate}
                initialValues={{
                  contentType: 'passage',
                  skill: 'Reading',
                  difficulty: 'medium',
                  wordCount: 250
                }}
              >
                <Form.Item
                  label="Loại nội dung"
                  name="contentType"
                  rules={[{ required: true }]}
                  tooltip="Chọn loại nội dung muốn tạo"
                >
                  <Select>
                    {Object.entries(contentTypeExamples).map(([key, description]) => (
                      <Option key={key} value={key}>
                        <div>
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                          <br />
                          <small style={{ color: '#999' }}>{description}</small>
                        </div>
                      </Option>
                    ))}
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
                  tooltip="Càng cụ thể càng tốt"
                >
                  <Input placeholder="Ví dụ: The impact of social media on teenagers" />
                </Form.Item>

                <Form.Item
                  label="Độ khó"
                  name="difficulty"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="easy">Easy (A2-B1)</Option>
                    <Option value="medium">Medium (B1-B2)</Option>
                    <Option value="hard">Hard (C1-C2)</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Số từ (tùy chọn)"
                  name="wordCount"
                  tooltip="Số từ ước tính cho nội dung"
                >
                  <InputNumber min={50} max={1000} step={50} style={{ width: '100%' }} />
                </Form.Item>

                <Divider />

                <Form.Item>
                  <Space style={{ width: '100%' }} direction="vertical">
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<FileTextOutlined />}
                      loading={loading}
                      block
                      size="large"
                    >
                      Tạo nội dung với AI
                    </Button>
                    {generatedContent && (
                      <Button
                        icon={<RedoOutlined />}
                        onClick={handleReset}
                        block
                      >
                        Tạo nội dung mới
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            {generatedContent && (
              <Card className="info-card" size="small">
                <h4>Thông tin</h4>
                <p><strong>Loại:</strong> {generatedContent.metadata?.content_type || 'N/A'}</p>
                <p><strong>Kỹ năng:</strong> {generatedContent.metadata?.skill || 'N/A'}</p>
                <p><strong>Chủ đề:</strong> {generatedContent.metadata?.topic || 'N/A'}</p>
                <p><strong>Độ khó:</strong> {generatedContent.metadata?.difficulty || 'N/A'}</p>
                <p><strong>Số từ:</strong> {generatedContent.metadata?.word_count || 0}</p>
              </Card>
            )}
          </div>

          <div className="result-section">
            <Card
              title="Nội dung đã tạo"
              extra={
                generatedContent && (
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                    >
                      Copy
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                    >
                      Lưu
                    </Button>
                  </Space>
                )
              }
              className="result-card"
            >
              {loading && (
                <div className="loading-state">
                  <Spin size="large" />
                  <p>Đang tạo nội dung với AI...</p>
                  <p className="loading-hint">Quá trình này có thể mất 10-30 giây</p>
                </div>
              )}

              {!loading && !generatedContent && (
                <div className="empty-state">
                  <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                  <p>Chưa có nội dung nào</p>
                  <p className="empty-hint">Cấu hình và nhấn "Tạo nội dung với AI"</p>
                </div>
              )}

              {!loading && generatedContent && (
                <div className="content-display">
                  <div className="content-text">
                    {generatedContent.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="paragraph">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {generatedContent && (
              <Card title="Gợi ý sử dụng" size="small" className="tips-card">
                <ul className="tips-list">
                  <li>Copy nội dung để dán vào editor</li>
                  <li>Có thể chỉnh sửa trước khi lưu</li>
                  <li>Dùng cho phần Reading passage hoặc Listening script</li>
                  <li>Tạo câu hỏi dựa trên nội dung này</li>
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>
  );
};

export default ContentGenerator;
