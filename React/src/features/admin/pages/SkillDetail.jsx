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
import CKEditorWrapper from '../../../components/common/CKEditorWrapper';
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

  // Helper function to convert relative URL to absolute URL
  const getFullAudioUrl = (audioPath) => {
    if (!audioPath) return null;
    // If already a full URL, return as is
    if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
      return audioPath;
    }
    // Otherwise, prepend FastAPI URL
    const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
    return `${FASTAPI_URL}${audioPath}`;
  };

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
      const response = await adminService.getSkillById(skillId);
      console.log('Skill API response:', response);
      
      // Extract data from response (API returns {data: {...}, success: true})
      const skillData = response.data || response;
      console.log('Skill data extracted:', skillData);
      
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
      let sectionsData = [];
      try {
        sectionsData = await adminService.getSectionsBySkillId(skillId);
        console.log('Sections data loaded:', sectionsData);
      } catch (error) {
        console.error('Error loading sections:', error);
        if (error.response?.status === 401) {
          message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        } else if (error.response?.status === 500) {
          message.error('Lỗi server khi tải sections: ' + (error.response?.data?.detail || error.message));
        } else {
          message.error('Không thể tải sections: ' + (error.response?.data?.detail || error.message));
        }
        setSections([]);
        return;
      }
      
      // Transform sections data with editable state
      const transformedSections = sectionsData.map((section, index) => {
        // Try to parse content as JSON passage object and format it
        let content = section.content;
        let passageData = null;
        
        try {
          const parsed = JSON.parse(section.content);
          if (parsed && typeof parsed === 'object' && (parsed.content || parsed.introduction || parsed.title)) {
            // Store original passage data
            passageData = parsed;
            
            // Format passage nicely with HTML for display in CKEditor
            const parts = [];
            if (parsed.introduction) {
              parts.push(`<div style="font-style: italic; color: #666; margin-bottom: 16px;">${parsed.introduction.replace(/\n/g, '<br/>')}</div>`);
            }
            if (parsed.title) {
              parts.push(`<h2 style="margin-top: 16px; margin-bottom: 16px;">${parsed.title}</h2>`);
            }
            if (parsed.content) {
              parts.push(`<div style="text-align: justify; line-height: 1.6;">${parsed.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</div>`);
            }
            
            content = parts.join('');
          }
        } catch (e) {
          // Not JSON, keep original content
        }
        
        return {
          id: section.id,
          name: section.name,
          content: content,
          rawPassageData: passageData,  // Store original JSON for potential re-save
          feedback: section.feedback,
          uiLayer: section.ui_layer || 'default',
          audio: getFullAudioUrl(section.audio),
          questionGroupsCount: section.question_groups_count
        };
      });
      
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
            name: group.name,
            questionType: group.question_type,
            content: group.content,
            questionsCount: group.questions_count || 0
          }));
          
          // Fetch questions for each group
          for (let gIndex = 0; gIndex < sectionGroups.length; gIndex++) {
            const group = sectionGroups[gIndex];
            const groupKey = `${sIndex}-${gIndex}`;
            
            try {
              // Fetch questions from API
              const groupQuestions = await adminService.getQuestionsByGroupId(group.id);
              
              // Transform questions to UI format
              questionsData[groupKey] = groupQuestions.map(q => {
                let answers = [];
                
                // Parse options/answers field
                if (q.options) {
                  try {
                    const parsed = JSON.parse(q.options);
                    
                    // Check if it's new format (array of objects with answer_content, is_correct, feedback)
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].answer_content !== undefined) {
                      // New format from GPT
                      answers = parsed.map((opt, idx) => ({
                        id: opt.id || `temp-${idx}`,
                        content: opt.answer_content,
                        isCorrect: opt.is_correct || false,
                        feedback: opt.feedback || ''
                      }));
                    }
                    // Old format (simple array or objects with content/is_correct)
                    else if (Array.isArray(parsed)) {
                      answers = parsed.map((opt, idx) => ({
                        id: opt.id || `temp-${idx}`,
                        content: opt.content || opt,
                        isCorrect: opt.is_correct || false,
                        feedback: opt.feedback || ''
                      }));
                    }
                  } catch (e) {
                    console.error('Error parsing options:', e);
                  }
                }
                
                return {
                  id: q.id,
                  questionContent: q.question_text,
                  questionType: q.question_type,
                  correctAnswer: q.correct_answer,
                  points: q.points,
                  explanation: q.explanation,
                  answers: answers,
                  // For short_text, true/false/not given, yes/no/not given: answer content is in correct_answer field
                  answerContent: ['short_text', 'true_false_not_given', 'yes_no_not_given'].includes(q.question_type) 
                    ? q.correct_answer 
                    : ''
                };
              });
            } catch (error) {
              console.error(`Error fetching questions for group ${group.id}:`, error);
              questionsData[groupKey] = [];
            }
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
      uiLayer: 'default',
      audio: '',
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
      name: '',
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
      questionContent: '',
      questionType: 'multiple_choice',
      options: '',
      correct_answer: '',
      explanation: '',
      points: 1,
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
    if (!questions[groupKey] || !questions[groupKey][questionIndex]) return;
    
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
    if (!questions[groupKey] || !questions[groupKey][questionIndex]) return;
    
    const question = questions[groupKey][questionIndex];
    const newAnswers = (question.answers || []).filter((_, idx) => idx !== answerIndex);
    updateQuestion(sectionIndex, groupIndex, questionIndex, 'answers', newAnswers);
  };

  const updateAnswer = (sectionIndex, groupIndex, questionIndex, answerIndex, field, value) => {
    const groupKey = `${sectionIndex}-${groupIndex}`;
    if (!questions[groupKey] || !questions[groupKey][questionIndex]) return;
    
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

  const handleSaveAll = async () => {
    try {
      message.loading({ content: 'Đang lưu thay đổi...', key: 'saving' });
      
      let savedCount = 0;
      let errorCount = 0;
      
      // 1. Update Skill information
      try {
        await adminService.updateSkill(skillId, {
          name: skill.name,
          description: skill.description,
          skill_type: skill.skillType,
          time_limit: skill.timeLimit,
          is_active: skill.isActive,
          is_online: skill.isOnline
        });
        console.log('Skill updated successfully');
        savedCount++;
      } catch (error) {
        console.error('Error updating skill:', error);
        errorCount++;
      }
      
      // 2. Save/Update Sections
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        try {
          let audioUrl = section.audio;
          
          // Upload audio file if exists
          if (section.audioFile) {
            try {
              console.log('Uploading audio file:', section.audioFile.name);
              const uploadResult = await adminService.uploadAudio(section.audioFile);
              audioUrl = uploadResult.url;
              console.log('Audio uploaded successfully:', audioUrl);
              message.success(`Audio file uploaded: ${section.audioFile.name}`);
            } catch (uploadError) {
              console.error('Error uploading audio:', uploadError);
              message.error(`Failed to upload audio: ${uploadError.message}`);
              errorCount++;
              continue; // Skip this section if audio upload fails
            }
          }
          
          if (section.isNew) {
            // Create new section
            const newSection = await adminService.createSection(skillId, {
              name: section.name,
              content: section.content,
              feedback: section.feedback,
              ui_layer: section.uiLayer,
              audio: audioUrl || null
            });
            console.log('Created section:', newSection);
            // Update section with new ID and convert audio URL to full URL
            sections[i].id = newSection.id;
            sections[i].isNew = false;
            sections[i].audio = getFullAudioUrl(audioUrl);
            sections[i].audioFile = null;
            sections[i].audioPreview = null;
          } else {
            // Update existing section
            await adminService.updateSection(section.id, {
              name: section.name,
              content: section.content,
              feedback: section.feedback,
              ui_layer: section.uiLayer,
              audio: audioUrl || null
            });
            console.log('Updated section:', section.id);
            sections[i].audio = getFullAudioUrl(audioUrl);
            sections[i].audioFile = null;
            sections[i].audioPreview = null;
          }
          savedCount++;
        } catch (error) {
          console.error(`Error saving section ${i}:`, error);
          errorCount++;
        }
      }
      
      // 3. Save/Update Question Groups
      for (let sIndex = 0; sIndex < sections.length; sIndex++) {
        const section = sections[sIndex];
        const sectionGroups = groups[sIndex] || [];
        
        for (let gIndex = 0; gIndex < sectionGroups.length; gIndex++) {
          const group = sectionGroups[gIndex];
          try {
            if (group.isNew) {
              // Create new group
              const newGroup = await adminService.createGroup(section.id, {
                name: group.name || `Group ${gIndex + 1}`,
                question_type: group.questionType || 'multiple_choice',
                content: group.content
              });
              console.log('Created group:', newGroup);
              // Update group with new ID
              groups[sIndex][gIndex].id = newGroup.id;
              groups[sIndex][gIndex].isNew = false;
            } else if (group.id && !group.id.toString().startsWith('new-')) {
              // Update existing group
              await adminService.updateGroup(group.id, {
                name: group.name || `Group ${gIndex + 1}`,
                question_type: group.questionType || 'multiple_choice',
                content: group.content
              });
              console.log('Updated group:', group.id);
            }
            savedCount++;
          } catch (error) {
            console.error(`Error saving group ${sIndex}-${gIndex}:`, error);
            errorCount++;
          }
        }
      }
      
      // 4. Save/Update Questions
      for (let sIndex = 0; sIndex < sections.length; sIndex++) {
        const section = sections[sIndex];
        const sectionGroups = groups[sIndex] || [];
        
        for (let gIndex = 0; gIndex < sectionGroups.length; gIndex++) {
          const group = sectionGroups[gIndex];
          const groupKey = `${sIndex}-${gIndex}`;
          const groupQuestions = questions[groupKey] || [];
          
          // Skip if group doesn't have a valid ID yet
          if (!group.id || group.id.toString().startsWith('new-')) {
            console.warn(`Cannot save questions for group ${groupKey} - group not saved yet`);
            continue;
          }
          
          for (let qIndex = 0; qIndex < groupQuestions.length; qIndex++) {
            const question = groupQuestions[qIndex];
            try {
              // Prepare question data
              const questionData = {
                question_text: question.questionContent || '',
                question_type: question.questionType || 'multiple_choice',
                points: question.points || 1,
                explanation: question.explanation || null
              };
              
              // Handle answers for multiple choice questions
              if (question.questionType === 'multiple_choice' && question.answers && question.answers.length > 0) {
                // Convert answers to new format (answer_content, is_correct, feedback)
                const answers = question.answers.map((ans, idx) => ({
                  answer_content: ans.content || '',
                  is_correct: ans.isCorrect || false,
                  feedback: ans.feedback || ''
                }));
                questionData.options = JSON.stringify(answers);
                
                // Find correct answer content
                const correctAnswer = question.answers.find(ans => ans.isCorrect);
                if (correctAnswer) {
                  questionData.correct_answer = correctAnswer.content || '';
                }
              } else if (question.questionType === 'short_text' || 
                         question.questionType === 'true_false_not_given' || 
                         question.questionType === 'yes_no_not_given') {
                // For short text, true/false/not given, yes/no/not given: correct answer is the expected answer
                questionData.correct_answer = question.answerContent || question.correctAnswer || '';
              }
              
              if (question.isNew || question.id.toString().startsWith('new-')) {
                // Create new question - must include question_group_id
                questionData.question_group_id = group.id;
                const newQuestion = await adminService.createQuestion(questionData);
                console.log('Created question:', newQuestion);
                // Update question with new ID
                questions[groupKey][qIndex].id = newQuestion.id;
                questions[groupKey][qIndex].isNew = false;
              } else {
                // Update existing question - no need for question_group_id
                await adminService.updateQuestion(question.id, questionData);
                console.log('Updated question:', question.id);
              }
              savedCount++;
            } catch (error) {
              console.error(`Error saving question ${groupKey}-${qIndex}:`, error);
              errorCount++;
            }
          }
        }
      }
      
      message.success({ 
        content: `✅ Đã lưu: ${savedCount} items. ${errorCount > 0 ? `❌ Lỗi: ${errorCount} items` : ''}`, 
        key: 'saving', 
        duration: 3 
      });
      
      // Refresh data
      await fetchSkillDetail();
    } catch (error) {
      console.error('Error saving changes:', error);
      message.error({ 
        content: 'Lưu thay đổi thất bại: ' + (error.response?.data?.detail || error.message || 'Lỗi không xác định'), 
        key: 'saving',
        duration: 5
      });
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                <EditOutlined style={{ marginRight: 8 }} />
                Chỉnh sửa Skill: {skill.name}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                Cập nhật thông tin, sections, groups và questions
              </p>
            </div>
          </div>
          <Space>
            <Button onClick={() => navigate(-1)}>
              Hủy
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll}>
              Lưu tất cả thay đổi
            </Button>
          </Space>
        </div>
      </div>

      <div className="skill-detail-layout">
        {/* Sidebar Navigation */}
        <div className="skill-detail-sidebar">
          <div style={{ background: 'white', borderRadius: 8, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Skill Info Link */}
            <div 
              onClick={() => {
                setSelectedSection(null);
                setSelectedGroup(null);
                setSelectedQuestion(null);
              }}
              style={{
                padding: '8px 12px',
                background: selectedSection === null ? '#1890ff' : '#f0f5ff',
                borderRadius: 4,
                cursor: 'pointer',
                marginBottom: 12,
                fontWeight: 600,
                color: selectedSection === null ? 'white' : '#1890ff'
              }}
            >
              <BookOutlined style={{ marginRight: 8 }} />
              Skill Information
            </div>

            <Divider style={{ margin: '12px 0' }} />

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
          {/* Show Skill Info Editor when no section selected */}
          {selectedSection === null && selectedGroup === null && selectedQuestion === null ? (
            <div style={{ 
              padding: 24, 
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: 24 }}>
                <BookOutlined style={{ marginRight: 8 }} />
                Thông tin Skill
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Tên Skill <span style={{ color: 'red' }}>*</span>
                </label>
                <Input
                  value={skill.name}
                  onChange={(e) => setSkill({ ...skill, name: e.target.value })}
                  placeholder="Nhập tên skill"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mô tả</label>
                <Input.TextArea
                  value={skill.description || ''}
                  onChange={(e) => setSkill({ ...skill, description: e.target.value })}
                  placeholder="Nhập mô tả skill"
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Loại Skill</label>
                  <Select 
                    value={skill.skillType}
                    onChange={(value) => setSkill({ ...skill, skillType: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="reading">Reading</Option>
                    <Option value="listening">Listening</Option>
                    <Option value="writing">Writing</Option>
                    <Option value="speaking">Speaking</Option>
                  </Select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Thời gian (phút)</label>
                  <InputNumber
                    value={skill.timeLimit}
                    onChange={(value) => setSkill({ ...skill, timeLimit: value })}
                    placeholder="Nhập thời gian"
                    min={1}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Trạng thái</label>
                  <Switch
                    checked={skill.isActive}
                    onChange={(checked) => setSkill({ ...skill, isActive: checked })}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Online</label>
                  <Switch
                    checked={skill.isOnline}
                    onChange={(checked) => setSkill({ ...skill, isOnline: checked })}
                    checkedChildren="Online"
                    unCheckedChildren="Offline"
                  />
                </div>
              </div>

              <Divider />

              <div>
                <h4>Sections ({sections.length})</h4>
                <p style={{ color: '#666', fontSize: 13 }}>
                  Chọn một section từ sidebar để chỉnh sửa hoặc thêm section mới.
                </p>
              </div>
            </div>
          ) : selectedSection !== null && selectedGroup === null && selectedQuestion === null ? (
            /* Show Section Editor if only section is selected */
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
                // Safe check for section
                if (!sections[selectedSection]) {
                  return (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <p>Section not found.</p>
                      <Button onClick={() => setSelectedSection(null)}>Back to All Sections</Button>
                    </div>
                  );
                }
                
                const section = sections[selectedSection];
                return (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Section Name</label>
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(selectedSection, 'name', e.target.value)}
                        placeholder="Enter section name"
                      />
                    </div>

                    {/* Content */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Section Content</label>
                      <CKEditorWrapper
                        value={section.content || ''}
                        onChange={(value) => updateSection(selectedSection, 'content', value)}
                        placeholder="Enter section content (instructions, passage, etc.)..."
                      />
                    </div>

                    {/* Feedback */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Section Feedback</label>
                      <CKEditorWrapper
                        value={section.feedback || ''}
                        onChange={(value) => updateSection(selectedSection, 'feedback', value)}
                        placeholder="Enter feedback for this section..."
                      />
                    </div>

                    {/* UI Layer */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        UI Layer
                      </label>
                      <Select
                        value={section.uiLayer || 'default'}
                        onChange={(value) => updateSection(selectedSection, 'uiLayer', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="default">Default UI</Option>
                        <Option value="layer1">Layer 1</Option>
                        <Option value="layer2">Layer 2</Option>
                      </Select>
                    </div>

                    {/* Audio File - Only for Listening skill */}
                    {skill.skillType === 'listening' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                          Audio File
                        </label>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Upload
                            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                            maxCount={1}
                            fileList={section.audioFile ? [{
                              uid: '-1',
                              name: section.audioFile.name || 'audio.mp3',
                              status: 'done',
                            }] : []}
                            beforeUpload={(file) => {
                              // Validate file size (50MB max)
                              const maxSize = 50 * 1024 * 1024;
                              if (file.size > maxSize) {
                                message.error('File size must be less than 50MB!');
                                return false;
                              }
                              
                              // Create a preview URL for the uploaded file
                              const audioUrl = URL.createObjectURL(file);
                              updateSection(selectedSection, 'audioPreview', audioUrl);
                              updateSection(selectedSection, 'audioFile', file);
                              message.success(`${file.name} selected. Will upload when you save.`);
                              return false; // Prevent auto upload
                            }}
                            onRemove={() => {
                              updateSection(selectedSection, 'audio', '');
                              updateSection(selectedSection, 'audioFile', null);
                              updateSection(selectedSection, 'audioPreview', null);
                            }}
                          >
                            <Button icon={<UploadOutlined />}>Select Audio File</Button>
                          </Upload>
                          
                          <div style={{ fontSize: 12, color: '#999' }}>
                            Supported: MP3, WAV, OGG, M4A, AAC, FLAC (Max 50MB)
                          </div>
                          
                          <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                            Or enter audio URL:
                          </div>
                          <Input
                            value={section.audio && !section.audioFile ? section.audio : ''}
                            onChange={(e) => {
                              updateSection(selectedSection, 'audio', e.target.value);
                              updateSection(selectedSection, 'audioFile', null);
                              updateSection(selectedSection, 'audioPreview', null);
                            }}
                            placeholder="https://example.com/audio.mp3"
                            disabled={!!section.audioFile}
                          />
                          
                          {(section.audioPreview || section.audio) && (
                            <div>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                Audio URL: {section.audioPreview || section.audio}
                              </div>
                              <audio 
                                controls 
                                style={{ width: '100%', marginTop: 8 }}
                                onError={(e) => {
                                  console.error('Audio load error:', e);
                                  console.error('Audio URL:', section.audioPreview || section.audio);
                                  message.error('Không thể tải file audio. Kiểm tra URL hoặc file có tồn tại không.');
                                }}
                                onLoadedData={() => {
                                  console.log('Audio loaded successfully:', section.audioPreview || section.audio);
                                }}
                              >
                                <source src={section.audioPreview || section.audio} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                        </Space>
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
                // Safe check for question
                const groupKey = `${selectedSection}-${selectedGroup}`;
                if (!questions[groupKey] || !questions[groupKey][selectedQuestion]) {
                  return (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <p>Question not found. Please go back to group.</p>
                      <Button onClick={() => setSelectedQuestion(null)}>Back to Group</Button>
                    </div>
                  );
                }
                
                const question = questions[groupKey][selectedQuestion];
                return (
                  <div>
                    {/* Question Content */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Question Text <span style={{ color: 'red' }}>*</span>
                      </label>
                      <CKEditorWrapper
                        value={question.questionContent || ''}
                        onChange={(value) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'questionContent', value)}
                        placeholder="Enter question text..."
                      />
                    </div>

                    {/* Question Type and Points */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Question Type</label>
                        <Select 
                          value={question.questionType}
                          onChange={(value) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'questionType', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="multiple_choice">Multiple Choice</Option>
                          <Option value="short_text">Short Text</Option>
                          <Option value="yes_no_not_given">Yes/No/Not Given</Option>
                          <Option value="true_false_not_given">True/False/Not Given</Option>
                        </Select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Points</label>
                        <InputNumber
                          value={question.points || 1}
                          onChange={(value) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'points', value)}
                          min={1}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    {/* Explanation/Feedback */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Explanation</label>
                      <TextArea
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'explanation', e.target.value)}
                        placeholder="Enter explanation for the correct answer (optional)"
                        rows={3}
                      />
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
                              <CKEditorWrapper
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

                    {/* True/False/Not Given Answer */}
                    {question.questionType === 'true_false_not_given' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Correct Answer</label>
                        <Select
                          value={question.correctAnswer || question.answerContent || ''}
                          onChange={(value) => {
                            updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'answerContent', value);
                            updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'correctAnswer', value);
                          }}
                          style={{ width: '100%' }}
                          placeholder="Select correct answer"
                        >
                          <Option value="TRUE">TRUE</Option>
                          <Option value="FALSE">FALSE</Option>
                          <Option value="NOT GIVEN">NOT GIVEN</Option>
                        </Select>
                      </div>
                    )}

                    {/* Yes/No/Not Given Answer */}
                    {question.questionType === 'yes_no_not_given' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Correct Answer</label>
                        <Select
                          value={question.correctAnswer || question.answerContent || ''}
                          onChange={(value) => {
                            updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'answerContent', value);
                            updateQuestion(selectedSection, selectedGroup, selectedQuestion, 'correctAnswer', value);
                          }}
                          style={{ width: '100%' }}
                          placeholder="Select correct answer"
                        >
                          <Option value="YES">YES</Option>
                          <Option value="NO">NO</Option>
                          <Option value="NOT GIVEN">NOT GIVEN</Option>
                        </Select>
                      </div>
                    )}

                    {/* Feedback */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Feedback</label>
                      <CKEditorWrapper
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
                // Safe check for groups
                if (!groups[selectedSection] || !groups[selectedSection][selectedGroup]) {
                  return (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <p>Group not found. Please go back to section.</p>
                      <Button onClick={() => setSelectedGroup(null)}>Back to Section</Button>
                    </div>
                  );
                }
                
                const group = groups[selectedSection][selectedGroup];
                return (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Group Name</label>
                      <Input
                        value={group.name || ''}
                        onChange={(e) => updateGroup(selectedSection, selectedGroup, 'name', e.target.value)}
                        placeholder="Enter group name (e.g., Questions 1-5)"
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Question Type</label>
                      <Select
                        value={group.questionType || 'multiple_choice'}
                        onChange={(value) => updateGroup(selectedSection, selectedGroup, 'questionType', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="multiple_choice">Multiple Choice</Option>
                        <Option value="short_text">Short Text</Option>
                        <Option value="yes_no_not_given">Yes/No/Not Given</Option>
                        <Option value="true_false_not_given">True/False/Not Given</Option>
                      </Select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Question Group Content</label>
                      <CKEditorWrapper
                        value={group.content || ''}
                        onChange={(value) => updateGroup(selectedSection, selectedGroup, 'content', value)}
                        placeholder="Nhập nội dung nhóm câu hỏi (passage, đoạn văn, hội thoại...)..."
                      />
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
