import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Form, Input, Select, InputNumber, Space, message, Table, Tag, Divider, Modal, Spin, Descriptions } from 'antd';
import { PlusOutlined, DeleteOutlined, RobotOutlined, SaveOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { examsAPI, examAPI } from '@/lib/fastapi-client';
import './AIExamGenerator.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Trang tạo đề thi tự động bằng AI
 * Cho phép admin/teacher tạo đề thi hoàn chỉnh với nhiều sections
 */
const AIExamGenerator = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [examConfig, setExamConfig] = useState({
    examId: null,  // ID của bộ đề (Exam) đã có sẵn
    examTestId: null,  // ID của ExamTest đã có sẵn
    skillType: 'reading',  // reading, writing, listening, speaking
    skillName: 'Reading',  // Reading, Writing, Listening, Speaking
    timeLimit: 60,  // Thời gian làm bài (phút)
    sections: []
  });
  const [sections, setSections] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState({});
  const [previewModal, setPreviewModal] = useState({ visible: false, questions: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [exams, setExams] = useState([]);
  const [examTests, setExamTests] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  const { generateQuestions, generateExam, loading } = useAIGeneration();

  // Question types by skill (Reading chỉ 4 loại)
  const questionTypesBySkill = {
    reading: [
      { value: 'multiple_choice', label: 'Multiple Choice' },
      { value: 'short_answer', label: 'Short Answer' },
      { value: 'yes_no_not_given', label: 'Yes/No/Not Given' },
      { value: 'true_false_not_given', label: 'True/False/Not Given' }
    ],
    listening: [
      { value: 'multiple_choice', label: 'Multiple Choice' },
      { value: 'form_completion', label: 'Form Completion' },
      { value: 'note_completion', label: 'Note Completion' },
      { value: 'matching', label: 'Matching' },
      { value: 'short_answer', label: 'Short Answer' },
      { value: 'labeling', label: 'Labeling' }
    ],
    writing: [
      { value: 'essay', label: 'Essay' },
      { value: 'chart_description', label: 'Chart/Graph Description' },
      { value: 'letter', label: 'Letter Writing' },
      { value: 'report', label: 'Report Writing' }
    ],
    speaking: [
      { value: 'cue_card', label: 'Cue Card (Long Turn)' },
      { value: 'interview', label: 'Interview Questions' },
      { value: 'discussion', label: 'Discussion Questions' }
    ]
  };

  // Fetch danh sách bộ đề khi component mount
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const data = await examsAPI.listExams({ is_active: true });
      setExams(data || []);
      if (data.length === 0) {
        message.warning('Chưa có bộ đề nào. Vui lòng tạo bộ đề (Exam) trước.');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách bộ đề: ' + (error.message || 'Unknown error'));
      // Fallback to hardcoded data for demo
      setExams([
        { id: 1, name: 'IELTS Academic', type: 'IELTS' },
        { id: 2, name: 'TOEIC Standard', type: 'TOEIC' }
      ]);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamTests = async (examId) => {
    setLoadingTests(true);
    setExamTests([]);
    try {
      const data = await examAPI.getExamTests(examId);
      setExamTests(data || []);
      if (data.length === 0) {
        message.warning('Bộ đề này chưa có ExamTest nào. Vui lòng tạo ExamTest trước.');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách ExamTest: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingTests(false);
    }
  };

  // Step 1: Cấu hình đề thi cơ bản
  const handleBasicInfoSubmit = (values) => {
    setExamConfig({
      ...examConfig,
      examId: values.examId,
      examTestId: values.examTestId,
      skillType: values.skillType || 'reading',
      skillName: values.skillName || 'Reading',
      timeLimit: values.timeLimit || 60
    });
    setCurrentStep(1);
  };

  // Handle exam selection change
  const handleExamChange = (examId) => {
    fetchExamTests(examId);
  };

  // Step 2: Thêm sections (các phần trong skill)
  const handleAddSection = (values) => {
    const newSection = {
      id: Date.now(),
      name: values.sectionName || `Section ${sections.length + 1}`,
      topic: values.topic,
      difficulty: values.difficulty,
      num_questions: values.num_questions,
      question_types: values.question_types,
      content: values.content || ''
    };
    setSections([...sections, newSection]);
    form.resetFields(['sectionName', 'topic', 'difficulty', 'num_questions', 'question_types', 'content']);
    message.success('Đã thêm section mới');
  };

  const handleRemoveSection = (sectionId) => {
    setSections(sections.filter(s => s.id !== sectionId));
    const newGeneratedQuestions = { ...generatedQuestions };
    delete newGeneratedQuestions[sectionId];
    setGeneratedQuestions(newGeneratedQuestions);
  };

  // Step 3: Generate questions cho từng section
  const handleGenerateQuestionsForSection = async (section) => {
    setIsGenerating(true);
    try {
      const selectedExam = exams.find(e => e.id === examConfig.examId);
      
      console.log('Generating questions with config:', {
        examType: selectedExam?.type || 'IELTS',
        skill: examConfig.skillName,
        topic: section.topic,
        difficulty: section.difficulty,
        numQuestions: section.num_questions,
        questionTypes: section.question_types
      });
      
      const result = await generateQuestions({
        examType: selectedExam?.type || 'IELTS',
        skill: examConfig.skillName,
        topic: section.topic,
        difficulty: section.difficulty,
        numQuestions: section.num_questions,
        questionTypes: section.question_types
      });

      console.log('Generated result:', result);

      // Check new format: passage + question_groups
      if (result.data && result.data.passage && result.data.question_groups) {
        // New IELTS format with passage
        setGeneratedQuestions({
          ...generatedQuestions,
          [section.id]: {
            passage: result.data.passage,
            question_groups: result.data.question_groups
          }
        });
        const totalQuestions = result.data.question_groups.reduce((sum, group) => sum + group.questions.length, 0);
        message.success(`Đã tạo đề IELTS với passage và ${totalQuestions} câu hỏi cho ${section.name}`);
      } else if (result.data && result.data.question_groups) {
        // New format without passage (only question_groups)
        setGeneratedQuestions({
          ...generatedQuestions,
          [section.id]: {
            question_groups: result.data.question_groups
          }
        });
        const totalQuestions = result.data.question_groups.reduce((sum, group) => sum + group.questions.length, 0);
        message.success(`Đã tạo ${totalQuestions} câu hỏi cho ${section.name}`);
      } else if (result.data && result.data.questions) {
        // Fallback: "questions" key might contain question_groups
        const questions = result.data.questions;
        
        // Check if questions array contains objects with "group_name" (it's actually question_groups)
        if (questions.length > 0 && questions[0].group_name) {
          // This is question_groups with wrong key name - KEEP PASSAGE if exists!
          const dataToStore = {
            question_groups: questions  // Rename to question_groups
          };
          
          // Keep passage if backend sent it
          if (result.data.passage) {
            dataToStore.passage = result.data.passage;
          }
          
          setGeneratedQuestions({
            ...generatedQuestions,
            [section.id]: dataToStore
          });
          const totalQuestions = questions.reduce((sum, group) => sum + (group.questions?.length || 0), 0);
          message.success(`Đã tạo ${totalQuestions} câu hỏi cho ${section.name}`);
        } else {
          // Old format: flat questions array
          setGeneratedQuestions({
            ...generatedQuestions,
            [section.id]: { questions: questions }
          });
          message.success(`Đã tạo ${questions.length} câu hỏi cho ${section.name}`);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      message.error('Lỗi khi tạo câu hỏi: ' + errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewQuestions = (sectionId) => {
    const data = generatedQuestions[sectionId];
    const section = sections.find(s => s.id === sectionId);
    setPreviewModal({
      visible: true,
      data: data || null,
      section: section || null
    });
  };

  // Step 4: Tạo đề thi hoàn chỉnh
  const handleCreateExam = async () => {
    try {
      // Kiểm tra tất cả sections đã có câu hỏi chưa
      const missingQuestions = sections.filter(s => !generatedQuestions[s.id]);
      if (missingQuestions.length > 0) {
        message.warning('Vui lòng tạo câu hỏi cho tất cả các sections');
        return;
      }

      // Chuẩn bị data sections với format mới
      const sectionsData = sections.map(section => {
        const generatedData = generatedQuestions[section.id];
        
        console.log('=== DEBUG SECTION MAPPING ===');
        console.log('Section:', section.name, 'ID:', section.id);
        console.log('Generated data:', generatedData);
        console.log('Has passage?', generatedData?.passage);
        console.log('Has question_groups?', generatedData?.question_groups);
        console.log('Has questions?', generatedData?.questions);
        
        // Helper function to build section content từ passage
        const buildSectionContent = (passage) => {
          console.log('Building section content from passage:', passage);
          if (!passage) {
            console.log('No passage provided!');
            return '';
          }
          
          let content = '';
          
          // Backend đã format sẵn hết, chỉ cần ghép lại
          if (passage.introduction) {
            content += passage.introduction + '\n\n';
          }
          
          if (passage.title) {
            content += passage.title + '\n\n';
          }
          
          if (passage.content) {
            content += passage.content;
          }
          
          console.log('Built content length:', content.length);
          return content.trim();
        };
        
        // New format: passage + question_groups
        if (generatedData && generatedData.passage && generatedData.question_groups) {
          console.log('✅ Using passage + question_groups format');
          const builtContent = buildSectionContent(generatedData.passage);
          console.log('Final content length:', builtContent.length);
          return {
            name: section.name,
            topic: section.topic,
            difficulty: section.difficulty,
            num_questions: section.num_questions,
            question_types: section.question_types,
            content: builtContent,
            question_groups: generatedData.question_groups
          };
        }
        
        // New format: only question_groups (no passage)
        if (generatedData && generatedData.question_groups) {
          console.log('⚠️ Using question_groups only format (NO PASSAGE!)');
          return {
            name: section.name,
            topic: section.topic,
            difficulty: section.difficulty,
            num_questions: section.num_questions,
            question_types: section.question_types,
            content: section.content || '',
            question_groups: generatedData.question_groups
          };
        }
        
        // Old format: just questions (flat array)
        if (generatedData && generatedData.questions) {
          console.log('Using old questions format');
          return {
            name: section.name,
            topic: section.topic,
            difficulty: section.difficulty,
            num_questions: section.num_questions,
            question_types: section.question_types,
            content: section.content || '',
            questions: generatedData.questions
          };
        }
        
        // Fallback - shouldn't reach here
        console.error('No generated data found for section:', section.name);
        return {
          name: section.name,
          topic: section.topic,
          difficulty: section.difficulty,
          num_questions: section.num_questions,
          question_types: section.question_types,
          content: section.content || '',
          questions: []
        };
      });

      const result = await generateExam({
        examId: examConfig.examId,
        examTestId: examConfig.examTestId,
        skillType: examConfig.skillType,
        skillName: examConfig.skillName,
        timeLimit: examConfig.timeLimit,
        sections: sectionsData
      });

      message.success('Đề thi đã được tạo thành công!');
      Modal.success({
        title: 'Thành công!',
        content: (
          <div>
            <p>Skill <strong>{examConfig.skillName}</strong> đã được tạo thành công!</p>
            <p>Skill ID: {result.exam_id}</p>
            <p>Tổng số câu hỏi: {sections.reduce((sum, s) => sum + s.num_questions, 0)}</p>
            <p>{result.message}</p>
          </div>
        ),
        onOk: () => {
          // Reset form
          setCurrentStep(0);
          setSections([]);
          setGeneratedQuestions({});
          form.resetFields();
        }
      });
    } catch (error) {
      message.error('Lỗi khi tạo đề thi: ' + (error.message || 'Unknown error'));
    }
  };

  const sectionColumns = [
    {
      title: 'Section Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic'
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        const colors = { easy: 'green', medium: 'orange', hard: 'red' };
        return <Tag color={colors[difficulty]}>{difficulty.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Questions',
      dataIndex: 'num_questions',
      key: 'num_questions'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const hasQuestions = generatedQuestions[record.id];
        return hasQuestions ? 
          <Tag color="success">Generated</Tag> : 
          <Tag color="default">Pending</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!generatedQuestions[record.id] ? (
            <Button
              type="primary"
              size="small"
              icon={<RobotOutlined />}
              onClick={() => handleGenerateQuestionsForSection(record)}
              loading={isGenerating}
            >
              Generate
            </Button>
          ) : (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewQuestions(record.id)}
            >
              Preview
            </Button>
          )}
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveSection(record.id)}
          >
            Remove
          </Button>
        </Space>
      )
    }
  ];

  const steps = [
    {
      title: 'Thông tin cơ bản',
      content: (
        <Card title="Cấu hình đề thi">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleBasicInfoSubmit}
            initialValues={{ skillType: 'reading', skillName: 'Reading', timeLimit: 60 }}
          >
            <Form.Item
              label="Chọn bộ đề (Exam)"
              name="examId"
              rules={[{ required: true, message: 'Vui lòng chọn bộ đề' }]}
              extra="Chọn bộ đề có sẵn (IELTS, TOEIC, ...)"
            >
              <Select 
                placeholder="Chọn bộ đề"
                loading={loadingExams}
                notFoundContent={loadingExams ? <Spin size="small" /> : 'Không có bộ đề nào'}
                onChange={handleExamChange}
              >
                {exams.map(exam => (
                  <Option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.type})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Chọn ExamTest (Đề thi)"
              name="examTestId"
              rules={[{ required: true, message: 'Vui lòng chọn ExamTest' }]}
              extra="Chọn đề thi có sẵn (Test 1, Test 2, ...) để tạo skill mới"
            >
              <Select 
                placeholder="Chọn ExamTest"
                loading={loadingTests}
                notFoundContent={loadingTests ? <Spin size="small" /> : 'Chọn Exam trước'}
                disabled={!examConfig.examId && !form.getFieldValue('examId')}
              >
                {examTests.map(test => (
                  <Option key={test.id} value={test.id}>
                    {test.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider />

            <Form.Item
              label="Skill Type"
              name="skillType"
              rules={[{ required: true }]}
            >
              <Select onChange={(value) => {
                const names = { reading: 'Reading', writing: 'Writing', listening: 'Listening', speaking: 'Speaking' };
                form.setFieldValue('skillName', names[value]);
              }}>
                <Option value="reading">Reading</Option>
                <Option value="writing">Writing</Option>
                <Option value="listening">Listening</Option>
                <Option value="speaking">Speaking</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Skill Name"
              name="skillName"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g., Reading, Writing" />
            </Form.Item>

            <Form.Item
              label="Thời gian làm bài (phút)"
              name="timeLimit"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={180} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Tiếp tục
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      title: 'Thêm Sections',
      content: (
        <div>
          <Card title="Thêm Section mới" style={{ marginBottom: 16 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddSection}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  label="Tên Section"
                  name="sectionName"
                  rules={[{ required: true, message: 'Vui lòng nhập tên section' }]}
                >
                  <Input placeholder="e.g., Section 1, Part A" />
                </Form.Item>

                <Form.Item
                  label="Topic"
                  name="topic"
                  rules={[{ required: true, message: 'Vui lòng nhập topic' }]}
                >
                  <Input placeholder="e.g., Environment, Technology" />
                </Form.Item>

                <Form.Item
                  label="Difficulty"
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
                  name="num_questions"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label="Loại câu hỏi"
                  name="question_types"
                  extra={`Các loại câu hỏi cho ${examConfig.skillName || 'Reading'}`}
                >
                  <Select 
                    mode="multiple" 
                    placeholder="Chọn loại câu hỏi (để trống = tất cả)"
                    allowClear
                  >
                    {(questionTypesBySkill[examConfig.skillType] || questionTypesBySkill.reading).map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <Form.Item
                label="Nội dung (Passage/Dialogue)"
                name="content"
              >
                <TextArea rows={4} placeholder="Nhập passage hoặc dialogue nếu có..." />
              </Form.Item>

              <Form.Item>
                <Button type="dashed" htmlType="submit" icon={<PlusOutlined />} block>
                  Thêm Section
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {sections.length > 0 && (
            <Card title={`Danh sách Sections (${sections.length})`}>
              <Table
                dataSource={sections}
                columns={sectionColumns}
                rowKey="id"
                pagination={false}
              />
              <Divider />
              <Space>
                <Button onClick={() => setCurrentStep(0)}>
                  Quay lại
                </Button>
                <Button type="primary" onClick={() => setCurrentStep(2)}>
                  Tiếp tục
                </Button>
              </Space>
            </Card>
          )}
        </div>
      )
    },
    {
      title: 'Tạo câu hỏi',
      content: (
        <Card title="Tạo câu hỏi với AI">
          <p style={{ marginBottom: 16 }}>
            Nhấn "Generate" để tạo câu hỏi tự động cho từng section bằng AI.
          </p>
          <Table
            dataSource={sections}
            columns={sectionColumns}
            rowKey="id"
            pagination={false}
          />
          <Divider />
          <Space>
            <Button onClick={() => setCurrentStep(1)}>
              Quay lại
            </Button>
            <Button 
              type="primary" 
              onClick={() => setCurrentStep(3)}
              disabled={sections.some(s => !generatedQuestions[s.id])}
            >
              Tiếp tục
            </Button>
          </Space>
        </Card>
      )
    },
    {
      title: 'Hoàn thành',
      content: (
        <Card title="Xác nhận và tạo đề thi">
          <div style={{ marginBottom: 24 }}>
            <h3>Thông tin đề thi:</h3>
            <p><strong>Bộ đề:</strong> {exams.find(e => e.id === examConfig.examId)?.name || 'N/A'}</p>
            <p><strong>ExamTest:</strong> {examTests.find(t => t.id === examConfig.examTestId)?.name || 'N/A'}</p>
            <p><strong>Skill:</strong> {examConfig.skillName} ({examConfig.timeLimit} phút)</p>
            <p><strong>Số sections:</strong> {sections.length}</p>
            <p><strong>Tổng số câu hỏi:</strong> {sections.reduce((sum, s) => sum + s.num_questions, 0)}</p>
          </div>

          <Table
            dataSource={sections}
            columns={sectionColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />

          <Divider />
          <Space>
            <Button onClick={() => setCurrentStep(2)}>
              Quay lại
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleCreateExam}
              loading={loading}
              size="large"
            >
              Tạo đề thi
            </Button>
          </Space>
        </Card>
      )
    }
  ];

  return (
    <div className="ai-exam-generator">
      <div className="page-header">
        <h1>
          <RobotOutlined /> Tạo đề thi bằng AI
        </h1>
        <p>Sử dụng AI để tạo đề thi hoàn chỉnh tự động</p>
      </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Steps.Step key={index} title={step.title} />
          ))}
        </Steps>

        <div className="step-content">
          {steps[currentStep].content}
        </div>

        {/* Preview Modal - Updated with Section Info và Format theo yêu cầu */}
        <Modal
          title="Xem trước câu hỏi đã tạo"
          visible={previewModal.visible}
          onCancel={() => setPreviewModal({ visible: false, data: null, section: null })}
          footer={[
            <Button key="close" onClick={() => setPreviewModal({ visible: false, data: null, section: null })}>
              Đóng
            </Button>
          ]}
          width={1200}
        >
          <div className="questions-preview" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {/* Section Info */}
            {previewModal.section && (
              <Card style={{ marginBottom: 24, background: '#f0f5ff', border: '2px solid #1890ff' }}>
                <h3 style={{ marginBottom: 16, color: '#1890ff' }}>📋 Section Information</h3>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div><strong>Section Name:</strong> <Tag color="blue">{previewModal.section.name}</Tag></div>
                  <div><strong>Topic:</strong> {previewModal.section.topic}</div>
                  <div>
                    <strong>Difficulty:</strong>{' '}
                    <Tag color={
                      previewModal.section.difficulty === 'easy' ? 'green' :
                      previewModal.section.difficulty === 'medium' ? 'orange' : 'red'
                    }>
                      {previewModal.section.difficulty?.toUpperCase()}
                    </Tag>
                  </div>
                  <div><strong>Number of Questions:</strong> {previewModal.section.num_questions}</div>
                  <div><strong>Question Types:</strong> {previewModal.section.question_types?.join(', ') || 'N/A'}</div>
                </Space>
              </Card>
            )}

            {/* Passage */}
            {previewModal.data && previewModal.data.passage && (
              <div style={{ marginBottom: 32, padding: 20, background: '#f5f5f5', borderRadius: 8, border: '1px solid #d9d9d9' }}>
                <h3 style={{ color: '#1890ff', fontSize: 18 }}>{previewModal.data.passage.title}</h3>
                {previewModal.data.passage.introduction && (
                  <p style={{ fontStyle: 'italic', marginBottom: 16, color: '#666' }}>
                    {previewModal.data.passage.introduction}
                  </p>
                )}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                  {previewModal.data.passage.content}
                </div>
                {previewModal.data.passage.word_count && (
                  <p style={{ marginTop: 16, color: '#888', textAlign: 'right' }}>
                    <small>📊 Word count: {previewModal.data.passage.word_count}</small>
                  </p>
                )}
              </div>
            )}

            {/* Question Groups */}
            {previewModal.data && previewModal.data.question_groups && previewModal.data.question_groups.map((group, groupIdx) => (
              <div key={groupIdx} style={{ marginBottom: 32, padding: 20, border: '2px solid #1890ff', borderRadius: 8, background: '#fafafa' }}>
                <h4 style={{ color: '#1890ff', marginBottom: 16, fontSize: 16 }}>
                  {group.group_name}
                </h4>
                {group.instruction && (
                  <div style={{ marginBottom: 20, padding: 12, background: '#e6f7ff', borderLeft: '4px solid #1890ff', borderRadius: 4 }}>
                    <strong>📝 Instructions:</strong> {group.instruction}
                  </div>
                )}
                
                {/* Questions in Group */}
                {group.questions.map((q, qIdx) => (
                  <Card key={qIdx} style={{ marginBottom: 16, background: 'white' }} size="small">
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize: 15, color: '#262626' }}>
                        Question {q.question_number || (qIdx + 1)}: {q.question_text || q.content}
                      </strong>
                    </div>
                    
                    {/* Multiple Choice - Answer Content và Is Correct */}
                    {q.question_type === 'multiple_choice' && q.options && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 8, color: '#8c8c8c', fontSize: 13 }}>
                          <strong>Answer Content:</strong>
                        </div>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {q.options.map((opt, optIdx) => (
                            <div 
                              key={optIdx} 
                              style={{ 
                                padding: '10px 14px', 
                                background: opt.is_correct ? '#f6ffed' : '#fafafa',
                                border: opt.is_correct ? '2px solid #52c41a' : '1px solid #d9d9d9',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span style={{ fontWeight: opt.is_correct ? 600 : 400 }}>
                                <strong>{opt.option_letter || String.fromCharCode(65 + optIdx)}.</strong> {opt.option_text}
                              </span>
                              {opt.is_correct && <Tag color="success">✓ Is Correct</Tag>}
                            </div>
                          ))}
                        </Space>
                      </div>
                    )}
                    
                    {/* Short Answer - Expected Answer */}
                    {(q.question_type === 'short_answer' || q.question_type === 'short_text') && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 6, color: '#8c8c8c', fontSize: 13 }}>
                          <strong>Expected Answer:</strong>
                        </div>
                        <div style={{ padding: '10px 14px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>{q.correct_answer}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* True/False/Not Given OR Yes/No/Not Given - Expected Answer + Explanation */}
                    {(q.question_type === 'yes_no_not_given' || q.question_type === 'true_false_not_given') && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 8, color: '#8c8c8c', fontSize: 13 }}>
                          <strong>Expected Answer:</strong>
                        </div>
                        <Space size="middle" style={{ marginBottom: 12 }}>
                          <Tag 
                            color={(q.correct_answer === 'yes' || q.correct_answer === 'true') ? 'success' : 'default'}
                            style={{ 
                              padding: '6px 16px', 
                              fontSize: 14,
                              fontWeight: (q.correct_answer === 'yes' || q.correct_answer === 'true') ? 600 : 400
                            }}
                          >
                            {q.question_type === 'yes_no_not_given' ? 'Yes' : 'True'}
                            {(q.correct_answer === 'yes' || q.correct_answer === 'true') && ' ✓'}
                          </Tag>
                          <Tag 
                            color={(q.correct_answer === 'no' || q.correct_answer === 'false') ? 'error' : 'default'}
                            style={{ 
                              padding: '6px 16px', 
                              fontSize: 14,
                              fontWeight: (q.correct_answer === 'no' || q.correct_answer === 'false') ? 600 : 400
                            }}
                          >
                            {q.question_type === 'yes_no_not_given' ? 'No' : 'False'}
                            {(q.correct_answer === 'no' || q.correct_answer === 'false') && ' ✓'}
                          </Tag>
                          <Tag 
                            color={q.correct_answer === 'not_given' ? 'warning' : 'default'}
                            style={{ 
                              padding: '6px 16px', 
                              fontSize: 14,
                              fontWeight: q.correct_answer === 'not_given' ? 600 : 400
                            }}
                          >
                            Not Given
                            {q.correct_answer === 'not_given' && ' ✓'}
                          </Tag>
                        </Space>
                        {q.explanation && (
                          <div>
                            <div style={{ marginBottom: 6, color: '#8c8c8c', fontSize: 13 }}>
                              <strong>Explanation:</strong>
                            </div>
                            <div style={{ padding: '10px 14px', background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
                              {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ))}

            {/* Fallback: old format */}
            {previewModal.data && previewModal.data.questions && !previewModal.data.question_groups && (
              <div className="questions-list">
                {previewModal.data.questions.map((q, idx) => (
                  <Card key={idx} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Question {idx + 1}</strong>
                      <Tag color="blue" style={{ marginLeft: 8 }}>{q.question_type}</Tag>
                    </div>
                    <p>{q.content || q.question_text}</p>
                    {q.correct_answer && (
                      <div style={{ color: '#52c41a', marginTop: 8 }}>
                        <strong>Answer:</strong> {q.correct_answer}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
  );
};

export default AIExamGenerator;
