import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Descriptions,
  message,
  Spin,
  Tabs,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Popconfirm,
  Upload,
  Collapse,
  Checkbox,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  BookOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  DownOutlined,
  UpOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import './SkillDetail.css';
import adminService from '../services/adminService';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const SkillDetail = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState(null);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState({});
  const [questions, setQuestions] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [form] = Form.useForm();
  
  // Get examId and testId from state if passed from navigation
  const { examId, testId } = location.state || {};

  // Toggle section collapse
  const toggleSection = (sectionIndex) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  // Toggle group collapse
  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Calculate continuous question number across all groups in a section
  const getQuestionNumber = (sectionIndex, groupIndex, questionIndex) => {
    let totalQuestions = 0;
    // Count all questions in previous groups
    for (let i = 0; i < groupIndex; i++) {
      const groupKey = `${sectionIndex}-${i}`;
      totalQuestions += (questions[groupKey]?.length || 0);
    }
    // Add current question index
    return totalQuestions + questionIndex + 1;
  };

  useEffect(() => {
    fetchSkillDetail();
  }, [skillId]);

  const fetchSkillDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch skill detail
      const skillData = await adminService.getSkillById(skillId);
      
      // Transform API data to UI format
      setSkill({
        id: skillData.id,
        name: skillData.name,
        skillType: skillData.skill_type,
        description: skillData.description,
        timeLimit: skillData.time_limit,
        image: skillData.image,
        isActive: skillData.is_active,
        isOnline: skillData.is_online,
        examTest: {
          id: skillData.exam_test_id,
          name: skillData.exam_test_name,
          exam: {
            id: skillData.exam_id,
            name: skillData.exam_name,
            type: skillData.exam_type
          }
        }
      });

      // Fetch sections for this skill
      const sectionsData = await adminService.getSectionsBySkillId(skillId);
      
      // Transform sections data with editable state
      const transformedSections = sectionsData.map((section, index) => ({
        id: section.id,
        name: section.name,
        content: section.content,
        contentFormat: section.content_format,
        orderIndex: section.order_index,
        audioFile: section.audio_file,
        videoFile: section.video_file,
        feedback: section.feedback,
        questionGroupsCount: section.question_groups_count
      }));
      
      setSections(transformedSections);
      
      // Fetch groups and questions for each section
      const groupsData = {};
      const questionsData = {};
      
      for (let sIndex = 0; sIndex < transformedSections.length; sIndex++) {
        const section = transformedSections[sIndex];
        try {
          const sectionGroups = await adminService.getGroupsBySectionId(section.id);
          groupsData[sIndex] = sectionGroups.map(group => ({
            id: group.id,
            content: group.content,
            questionType: group.question_type,
            questionCount: group.questions?.length || 0
          }));
          
          // Fetch questions for each group
          for (let gIndex = 0; gIndex < sectionGroups.length; gIndex++) {
            const group = sectionGroups[gIndex];
            const groupKey = `${sIndex}-${gIndex}`;
            questionsData[groupKey] = group.questions || [];
          }
        } catch (error) {
          console.error(`Error fetching groups for section ${section.id}:`, error);
          groupsData[sIndex] = [];
        }
      }
      
      setGroups(groupsData);
      setQuestions(questionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching skill detail:', error);
      message.error('Tải thông tin đề thi thất bại');
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    const newSection = {
      id: `new-${Date.now()}`,
      name: '',
      content: '',
      feedback: '',
      orderIndex: sections.length + 1,
      isNew: true
    };
    setSections([...sections, newSection]);
    setGroups({ ...groups, [sections.length]: [] });
  };

  const handleDeleteSection = async (sectionIndex) => {
    console.log('Delete section clicked, index:', sectionIndex);
    
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa section này? Tất cả groups và questions sẽ bị xóa!');
    
    if (!confirmed) {
      console.log('Section deletion cancelled');
      return;
    }
    
    try {
      console.log('Confirming delete for section index:', sectionIndex);
      
      const section = sections[sectionIndex];
      
      // Try to delete from API if not new
      if (section && !section.isNew) {
        console.log('Deleting section from API, ID:', section.id);
        await adminService.deleteSection(section.id);
        console.log('Section deleted from API successfully');
      }
      
      // Remove section from state
      const newSections = sections.filter((_, index) => index !== sectionIndex);
      console.log('New sections array:', newSections);
      setSections(newSections);
      
      // Update groups mapping
      const newGroups = {};
      Object.keys(groups).forEach(key => {
        const idx = parseInt(key);
        if (idx < sectionIndex) {
          newGroups[idx] = groups[key];
        } else if (idx > sectionIndex) {
          newGroups[idx - 1] = groups[key];
        }
      });
      console.log('New groups mapping:', newGroups);
      setGroups(newGroups);
      
      // Update questions mapping
      const newQuestions = {};
      Object.keys(questions).forEach(key => {
        const [sIdx, gIdx] = key.split('-').map(Number);
        if (sIdx < sectionIndex) {
          newQuestions[key] = questions[key];
        } else if (sIdx > sectionIndex) {
          newQuestions[`${sIdx - 1}-${gIdx}`] = questions[key];
        }
      });
      console.log('New questions mapping:', newQuestions);
      setQuestions(newQuestions);
      
      // Reset selection
      setSelectedSection(null);
      setSelectedGroup(null);
      setSelectedQuestion(null);
      
      message.success('Đã xóa section thành công!');
      console.log('Section deletion completed');
    } catch (error) {
      console.error('Error deleting section:', error);
      message.error('Không thể xóa section: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const updateSection = (sectionIndex, field, value) => {
    const newSections = [...sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      [field]: value
    };
    setSections(newSections);
  };

  const handleAddGroup = (sectionIndex) => {
    const sectionGroups = groups[sectionIndex] || [];
    const newGroup = {
      id: `new-${Date.now()}`,
      content: '',
      questionType: 'multiple_choice',
      questionCount: 0,
      isNew: true
    };
    setGroups({
      ...groups,
      [sectionIndex]: [...sectionGroups, newGroup]
    });
  };

  const handleDeleteGroup = (sectionIndex, groupIndex) => {
    const sectionGroups = groups[sectionIndex] || [];
    const newGroups = sectionGroups.filter((_, idx) => idx !== groupIndex);
    setGroups({
      ...groups,
      [sectionIndex]: newGroups
    });
  };

  const updateGroup = (sectionIndex, groupIndex, field, value) => {
    const newGroups = { ...groups };
    if (!newGroups[sectionIndex]) return;
    newGroups[sectionIndex][groupIndex] = {
      ...newGroups[sectionIndex][groupIndex],
      [field]: value
    };
    setGroups(newGroups);
  };

  const handleAddQuestion = (sectionIndex, groupIndex) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    const groupQuestions = questions[groupKey] || [];
    const newQuestion = {
      id: `new-${Date.now()}`,
      content: '',
      point: 1,
      questionType: 'short_text',
      answerContent: '',
      feedback: '',
      isNew: true,
      answers: []
    };
    setQuestions({
      ...questions,
      [groupKey]: [...groupQuestions, newQuestion]
    });
  };

  const handleDeleteQuestion = (sectionIndex, groupIndex, questionIndex) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    const groupQuestions = questions[groupKey] || [];
    const newQuestions = groupQuestions.filter((_, idx) => idx !== questionIndex);
    setQuestions({
      ...questions,
      [groupKey]: newQuestions
    });
  };

  const updateQuestion = (sectionIndex, groupIndex, questionIndex, field, value) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    const newQuestions = { ...questions };
    if (!newQuestions[groupKey]) return;
    newQuestions[groupKey][questionIndex] = {
      ...newQuestions[groupKey][questionIndex],
      [field]: value
    };
    setQuestions(newQuestions);
  };

  const handleAddAnswer = (sectionIndex, groupIndex, questionIndex) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    const question = questions[groupKey][questionIndex];
    const newAnswer = {
      id: `new-${Date.now()}`,
      content: '',
      feedback: '',
      isCorrect: false
    };
    updateQuestion(sectionIndex, groupIndex, questionIndex, 'answers', [
      ...(question.answers || []),
      newAnswer
    ]);
  };

  const handleDeleteAnswer = (sectionIndex, groupIndex, questionIndex, answerIndex) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    const question = questions[groupKey][questionIndex];
    const newAnswers = (question.answers || []).filter((_, idx) => idx !== answerIndex);
    updateQuestion(sectionIndex, groupIndex, questionIndex, 'answers', newAnswers);
  };

  const updateAnswer = (sectionIndex, groupIndex, questionIndex, answerIndex, field, value) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    const question = questions[groupKey][questionIndex];
    const newAnswers = [...(question.answers || [])];
    newAnswers[answerIndex] = {
      ...newAnswers[answerIndex],
      [field]: value
    };
    updateQuestion(sectionIndex, groupIndex, questionIndex, 'answers', newAnswers);
  };

  const handleManageQuestionGroups = (sectionId) => {
    navigate(`/admin/skills/${skillId}/sections/${sectionId}/groups`);
  };

  const handleTakeTest = () => {
    const actualTestId = testId || skill?.examTest?.id;
    const testUrl = `/exam/full/${actualTestId}/test/${skill.skillType}`;
    window.open(testUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!skill) {
    return <div>Không tìm thấy đề thi</div>;
  }

  return (
    <div className="skill-detail-container">
      {/* Header */}
      <div className="skill-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              style={{ marginRight: 16 }}
            />
          </div>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Button type="primary" icon={<SaveOutlined />}>
              Cập nhật
            </Button>
          </Space>
        </div>
      </div>

      <div className="skill-detail-layout">
        {/* Sidebar Navigation */}
        <div className="skill-detail-sidebar">
          <div style={{ background: 'white', borderRadius: 8, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {sections.map((section, sIndex) => (
              <div key={sIndex} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    padding: '8px 12px',
                    background: selectedSection === sIndex && selectedGroup === null && selectedQuestion === null ? '#1890ff' : '#f0f5ff',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 500,
                    color: selectedSection === sIndex && selectedGroup === null && selectedQuestion === null ? 'white' : '#1890ff'
                  }}
                >
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSection(sIndex);
                      setSelectedGroup(null);
                      setSelectedQuestion(null);
                    }}
                    style={{ flex: 1 }}
                  >
                    Section {sIndex + 1}
                  </span>
                  <span onClick={() => toggleSection(sIndex)} style={{ padding: '0 4px' }}>
                    {collapsedSections[sIndex] ? <UpOutlined /> : <DownOutlined />}
                  </span>
                </div>
                
                {!collapsedSections[sIndex] && groups[sIndex] && groups[sIndex].length > 0 && (
                  <div style={{ paddingLeft: 20, marginTop: 4 }}>
                    {groups[sIndex].map((group, gIndex) => (
                      <div key={gIndex} style={{ marginBottom: 4 }}>
                        <div
                          style={{
                            padding: '6px 12px',
                            background: selectedSection === sIndex && selectedGroup === gIndex && selectedQuestion === null ? '#1890ff' : '#f5f5f5',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                            color: selectedSection === sIndex && selectedGroup === gIndex && selectedQuestion === null ? 'white' : '#666',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSection(sIndex);
                              setSelectedGroup(gIndex);
                              setSelectedQuestion(null);
                            }}
                            style={{ flex: 1 }}
                          >
                            Group {gIndex + 1}
                          </span>
                          <span onClick={() => toggleGroup(`${sIndex}-${gIndex}`)} style={{ padding: '0 4px', fontSize: 10 }}>
                            {collapsedGroups[`${sIndex}-${gIndex}`] ? '▶' : '▼'}
                          </span>
                        </div>
                        
                        {!collapsedGroups[`${sIndex}-${gIndex}`] && questions[`${sIndex}-${gIndex}`] && (
                          <div style={{ paddingLeft: 20, marginTop: 2 }}>
                            {questions[`${sIndex}-${gIndex}`].map((question, qIndex) => {
                              const questionNumber = getQuestionNumber(sIndex, gIndex, qIndex);
                              return (
                                <a
                                  key={qIndex}
                                  href={`#question-${sIndex}-${gIndex}-${qIndex}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedSection(sIndex);
                                    setSelectedGroup(gIndex);
                                    setSelectedQuestion(qIndex);
                                  }}
                                  style={{
                                    display: 'block',
                                    padding: '4px 12px',
                                    fontSize: 12,
                                    color: selectedSection === sIndex && selectedGroup === gIndex && selectedQuestion === qIndex ? '#1890ff' : '#999',
                                    textDecoration: 'none',
                                    borderRadius: 4,
                                    background: selectedSection === sIndex && selectedGroup === gIndex && selectedQuestion === qIndex ? '#e6f7ff' : 'transparent'
                                  }}
                                >
                                  Question {questionNumber}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={handleAddSection}
              style={{ marginTop: 12 }}
            >
              Add Section
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="skill-detail-content">
          {/* Show Section Editor if only section is selected */}
          {selectedSection !== null && selectedGroup === null && selectedQuestion === null ? (
            <div style={{ 
              padding: 24, 
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Section {selectedSection + 1}
                </h3>
                <Space>
                  <Button onClick={() => setSelectedSection(null)}>Back to All Sections</Button>
                  <Button
                    danger
                    onClick={() => handleDeleteSection(selectedSection)}
                  >
                    Delete Section
                  </Button>
                </Space>
              </div>

              {(() => {
                const section = sections[selectedSection];
                return (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Section Title</label>
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(selectedSection, 'name', e.target.value)}
                        placeholder="Enter section title"
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Section Content</label>
                      <RichTextEditor
                        value={section.content || ''}
                        onChange={(value) => updateSection(selectedSection, 'content', value)}
                        placeholder="Nhập nội dung..."
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Section Feedback</label>
                      <RichTextEditor
                        value={section.feedback || ''}
                        onChange={(value) => updateSection(selectedSection, 'feedback', value)}
                        placeholder="Nhập phản hồi..."
                      />
                    </div>

                    {skill.skillType === 'listening' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                          Audio File <span style={{ color: 'red' }}>*</span>
                        </label>
                        <Upload>
                          <Button icon={<UploadOutlined />}>Tải lên âm thanh</Button>
                        </Upload>
                        {section.audioFile && (
                          <audio controls style={{ width: '100%', marginTop: 8 }}>
                            <source src={section.audioFile} />
                          </audio>
                        )}
                      </div>
                    )}

                    <Divider />

                    {/* Question Groups List */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4>Question Groups ({groups[selectedSection]?.length || 0})</h4>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddGroup(selectedSection)}
                        >
                          Add Question Group
                        </Button>
                      </div>

                      {groups[selectedSection] && groups[selectedSection].length > 0 ? (
                        <div>
                          {groups[selectedSection].map((group, gIndex) => (
                            <div 
                              key={gIndex}
                              onClick={() => setSelectedGroup(gIndex)}
                              style={{ 
                                padding: '12px 16px', 
                                background: '#f5f5f5', 
                                borderRadius: 6, 
                                marginBottom: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#e6f7ff'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            >
                              <span style={{ fontSize: 14 }}>
                                <AppstoreOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                Question Group {gIndex + 1}
                              </span>
                              <Tag color="blue">{questions[`${selectedSection}-${gIndex}`]?.length || 0} questions</Tag>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: 40, 
                          color: '#999', 
                          background: '#fafafa', 
                          borderRadius: 6,
                          border: '2px dashed #d9d9d9'
                        }}>
                          <AppstoreOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
                          <p style={{ margin: 0, fontSize: 16 }}>No question groups yet</p>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ marginTop: 16 }}
                            onClick={() => handleAddGroup(selectedSection)}
                          >
                            Add First Question Group
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : selectedQuestion !== null && selectedSection !== null && selectedGroup !== null ? (
            /* Show Question Editor if question is selected */
            <div style={{ 
              padding: 24, 
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}>
                  <EditOutlined style={{ marginRight: 8 }} />
                  Question {getQuestionNumber(selectedSection, selectedGroup, selectedQuestion)}
                </h3>
                <Space>
                  <Button onClick={() => setSelectedQuestion(null)}>Back to Group</Button>
                  <Button
                    danger
                    onClick={() => {
                      handleDeleteQuestion(selectedSection, selectedGroup, selectedQuestion);
                      setSelectedQuestion(null);
                    }}
                  >
                    Delete Question
                  </Button>
                </Space>
              </div>

              {(() => {
                const question = questions[`${selectedSection}-${selectedGroup}`][selectedQuestion];
                return (
                  <div>
                    {/* Question Content */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Question Content <span style={{ color: 'red' }}>*</span>
                      </label>
                      <RichTextEditor
                        value={question.content || ''}
                        onChange={(value) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'content', value)}
                        placeholder="Enter question content..."
                      />
                    </div>

                    {/* Points and Question Type */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Points</label>
                        <Input
                          type="number"
                          value={question.point}
                          onChange={(e) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'point', Number(e.target.value))}
                          placeholder="1"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Question Type</label>
                        <Select 
                          value={question.questionType}
                          onChange={(value) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'questionType', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="short_text">Short Text</Option>
                          <Option value="multiple_choice">Multiple Choice</Option>
                          <Option value="yes_no_not_given">Yes/No/Not Given</Option>
                          <Option value="true_false_not_given">True/False/Not Given</Option>
                        </Select>
                      </div>
                    </div>

                    {/* Answers Section for Multiple Choice */}
                    {question.questionType === 'multiple_choice' && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <label style={{ fontWeight: 500 }}>Answer Options</label>
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddAnswer(selectedSection, selectedGroup, selectedQuestion)}
                          >
                            Add Answer
                          </Button>
                        </div>

                        {(question.answers || []).map((answer, aIndex) => (
                          <div key={aIndex} style={{ 
                            border: '1px solid #e8e8e8', 
                            borderRadius: 6, 
                            padding: 12, 
                            marginBottom: 12,
                            background: '#fafafa'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <strong>Answer {aIndex + 1}</strong>
                              <Button
                                danger
                                type="link"
                                size="small"
                                onClick={() => handleDeleteAnswer(selectedSection, selectedGroup, selectedQuestion, aIndex)}
                              >
                                Delete
                              </Button>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', marginBottom: 8 }}>Answer Content</label>
                              <Input.TextArea
                                value={answer.content}
                                onChange={(e) => updateAnswer(selectedSection, selectedGroup, selectedQuestion, aIndex, 'content', e.target.value)}
                                placeholder="Enter answer content"
                                rows={2}
                              />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', marginBottom: 8 }}>Feedback</label>
                              <RichTextEditor
                                value={answer.feedback || ''}
                                onChange={(value) => updateAnswer(selectedSection, selectedGroup, selectedQuestion, aIndex, 'feedback', value)}
                                placeholder="Enter feedback for this answer..."
                              />
                            </div>

                            <Checkbox
                              checked={answer.isCorrect}
                              onChange={(e) => updateAnswer(selectedSection, selectedGroup, selectedQuestion, aIndex, 'isCorrect', e.target.checked)}
                            >
                              Is correct
                            </Checkbox>
                          </div>
                        ))}

                        {(!question.answers || question.answers.length === 0) && (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: 20, 
                            color: '#999', 
                            background: '#fafafa', 
                            borderRadius: 4,
                            border: '1px dashed #d9d9d9'
                          }}>
                            No answers yet. Click "Add Answer" to add options.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Short Text Answer */}
                    {question.questionType === 'short_text' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Expected Answer</label>
                        <Input.TextArea
                          value={question.answerContent || ''}
                          onChange={(e) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'answerContent', e.target.value)}
                          placeholder="Enter expected answer (for grading reference)"
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Feedback */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Feedback</label>
                      <RichTextEditor
                        value={question.feedback || ''}
                        onChange={(value) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'feedback', value)}
                        placeholder="Enter feedback for this question..."
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : selectedGroup !== null && selectedSection !== null ? (
            /* Show Group Editor if group is selected */
            <div style={{ 
              padding: 24, 
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  Question Group {selectedGroup + 1}
                </h3>
                <Space>
                  <Button onClick={() => setSelectedGroup(null)}>Back to Section</Button>
                  <Button
                    danger
                    onClick={() => {
                      handleDeleteGroup(selectedSection, selectedGroup);
                      setSelectedGroup(null);
                    }}
                  >
                    Delete Question Group
                  </Button>
                </Space>
              </div>

              {(() => {
                const group = groups[selectedSection][selectedGroup];
                return (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Question Group Content</label>
                      <RichTextEditor
                        value={group.content || ''}
                        onChange={(value) => updateGroup(selectedSection, selectedGroup, 'content', value)}
                        placeholder="Nhập nội dung nhóm câu hỏi..."
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Question Type</label>
                      <Select 
                        value={group.questionType} 
                        onChange={(value) => updateGroup(selectedSection, selectedGroup, 'questionType', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="multiple_choice">Multiple Choice</Option>
                        <Option value="yes_no_not_given">Yes/No/Not Given</Option>
                        <Option value="true_false_not_given">True/False/Not Given</Option>
                        <Option value="short_text">Short Text</Option>
                        <Option value="table_selection">Table Selection</Option>
                      </Select>
                    </div>

                    <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                      <Checkbox>Answer inputs inside content</Checkbox>
                      <Checkbox>Split content and questions side by side</Checkbox>
                      <Checkbox>Allow drag and drop answers</Checkbox>
                    </div>

                    <Divider />

                    {/* Questions List */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4>Questions ({questions[`${selectedSection}-${selectedGroup}`]?.length || 0})</h4>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddQuestion(selectedSection, selectedGroup)}
                        >
                          Add Question
                        </Button>
                      </div>

                      {questions[`${selectedSection}-${selectedGroup}`] && questions[`${selectedSection}-${selectedGroup}`].length > 0 ? (
                        <div>
                          {questions[`${selectedSection}-${selectedGroup}`].map((question, qIndex) => {
                            const questionNumber = getQuestionNumber(selectedSection, selectedGroup, qIndex);
                            return (
                              <div 
                                key={qIndex}
                                onClick={() => setSelectedQuestion(qIndex)}
                                style={{ 
                                  padding: '12px 16px', 
                                  background: '#f5f5f5', 
                                  borderRadius: 6, 
                                  marginBottom: 8,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e6f7ff'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                              >
                                <span style={{ fontSize: 14 }}>
                                  <QuestionCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                  Question {questionNumber}
                                </span>
                                <Tag color="green">{question.point || 1} pts</Tag>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: 40, 
                          color: '#999', 
                          background: '#fafafa', 
                          borderRadius: 6,
                          border: '2px dashed #d9d9d9'
                        }}>
                          <QuestionCircleOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
                          <p style={{ margin: 0, fontSize: 16 }}>No questions yet</p>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ marginTop: 16 }}
                            onClick={() => handleAddQuestion(selectedSection, selectedGroup)}
                          >
                            Add First Question
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Show all sections when nothing is selected */
            <>
              {sections.map((section, sIndex) => (
                <div
                  key={sIndex}
                  onClick={() => {
                    setSelectedSection(sIndex);
                    setSelectedGroup(null);
                    setSelectedQuestion(null);
                  }}
                  style={{
                    background: 'white',
                    borderRadius: 8,
                    marginBottom: 16,
                    padding: 20,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    border: selectedSection === sIndex && selectedGroup === null ? '2px solid #1890ff' : '1px solid #e8e8e8'
                  }}
                >
                  <h3>Section {sIndex + 1}</h3>
                  <p style={{ color: '#666', margin: 0 }}>{section.name || 'Untitled Section'}</p>
                </div>
              ))}

              <Button
                type="dashed"
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={handleAddSection}
                style={{ marginTop: 16 }}
              >
                Add Section
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillDetail;
