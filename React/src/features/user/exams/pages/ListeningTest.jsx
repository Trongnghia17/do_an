import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { getSkillById, getSectionById } from '../api/exams.api';
import fastapiService from '@/services/fastapi.service';
import TestLayout from '../components/TestLayout';
import './ListeningTest.css';

const containsInlinePlaceholders = (text) => /\{\{\s*[a-zA-Z0-9]+\s*\}\}/.test(text || '');

const isJSONString = (str) => {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const GroupContentWithInlineInputs = ({ content, questions = [], answers = {}, onAnswerChange }) => {
  const containerRef = useRef(null);
  const placeholdersMetaRef = useRef([]);
  const latestHandlerRef = useRef(onAnswerChange);

  useEffect(() => {
    latestHandlerRef.current = onAnswerChange;
  }, [onAnswerChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!content) {
      container.innerHTML = '';
      placeholdersMetaRef.current = [];
      return;
    }

    const placeholderRegex = /\{\{\s*([a-zA-Z0-9]+)\s*\}\}/g;
    const placeholderMeta = [];
    let questionIndex = 0;

    const processedContent = content.replace(placeholderRegex, (match) => {
      const question = questions[questionIndex];
      questionIndex += 1;

      if (!question) {
        return match;
      }

      const placeholderId = `inline-placeholder-${question.id}`;
      placeholderMeta.push({ placeholderId, question });
      return `<span class="listening-test__inline-placeholder" data-placeholder-id="${placeholderId}"></span>`;
    });

    container.innerHTML = processedContent;

    placeholderMeta.forEach((meta) => {
      const placeholderElement = container.querySelector(`[data-placeholder-id="${meta.placeholderId}"]`);
      if (!placeholderElement) return;

      const wrapper = document.createElement('span');
      wrapper.className = 'listening-test__inline-input-wrapper';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'listening-test__inline-input';
      input.placeholder = meta.question.number?.toString() || '';
      input.maxLength = 50;
      input.dataset.questionId = meta.question.id;
      input.autocomplete = 'off';

      const handleInput = (event) => {
        latestHandlerRef.current?.(meta.question.id, event.target.value);
      };

      const stopPropagation = (event) => event.stopPropagation();

      input.addEventListener('input', handleInput);
      input.addEventListener('focus', stopPropagation);
      input.addEventListener('click', stopPropagation);

      wrapper.appendChild(input);
      placeholderElement.replaceWith(wrapper);

      meta.input = input;
      meta.cleanup = () => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('focus', stopPropagation);
        input.removeEventListener('click', stopPropagation);
      };
    });

    placeholdersMetaRef.current = placeholderMeta;

    return () => {
      placeholderMeta.forEach((meta) => meta.cleanup?.());
    };
  }, [content, questions]);

  useEffect(() => {
    placeholdersMetaRef.current.forEach(({ question, input }) => {
      if (!input) return;
      const nextValue = answers?.[question.id] || '';
      if (input.value !== nextValue) {
        input.value = nextValue;
      }
    });
  }, [answers]);

  return (
    <div
      className="listening-test__group-content-parsed"
      ref={containerRef}
    />
  );
};

const ListeningTest = () => {
  const { skillId, sectionId } = useParams();
  const location = useLocation();
  const examData = location.state?.examData;
  
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(2400); // 40 minutes default
  const [currentPartTab, setCurrentPartTab] = useState(1);
  const [loading, setLoading] = useState(true);
  const [skillData, setSkillData] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [parts, setParts] = useState([]);
  const [fontSize, setFontSize] = useState('normal');
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        
        if (sectionId) {
          // Lấy data cho section cụ thể (1 part)
          const response = await getSectionById(sectionId, { with_questions: true });
          if (response.data.success) {
            const section = response.data.data;
            setSectionData(section);
            
            console.log('=== SECTION DATA ===');
            console.log('Section:', section);
            console.log('Section Audio URL:', section.audio_url);
            console.log('Section Question Groups:', section.question_groups);
            
            setParts([{ id: section.id, part: 1, title: `Part 1 (1-${section.question_groups?.reduce((sum, g) => sum + (g.questions?.length || 0), 0) || 0})` }]);
            
            // Get layout type from section
            const sectionLayoutType = parseInt(section.ui_layer) || 1;
            
            // Get audio URL from section level
            const sectionAudioUrl = section.audio_url || null;
            
            // Lấy question groups
            const allGroups = [];
            let questionNumber = 1;
            if (section.question_groups) {
              section.question_groups.forEach(group => {
                const questions = [];
                if (group.questions) {
                  group.questions.forEach((q) => {
                    questions.push({
                      id: q.id,
                      number: questionNumber++,
                      content: q.content,
                      correctAnswer: q.answer_content,
                      metadata: q.metadata
                    });
                  });
                }
                
                // Parse options based on question_type
                let options = [];
                let optionsWithContent = null;
                const questionType = (group.question_type || '').toLowerCase();
                
                    switch (questionType) {
                      case 'multiple_choice':
                        // Get from question.options (new API format) or metadata.answers (old format)
                        if (group.questions && group.questions.length > 0) {
                          const firstQuestion = group.questions[0];
                          
                          // Check if options array exists directly on the question
                          if (firstQuestion.options && Array.isArray(firstQuestion.options) && firstQuestion.options.length > 0) {
                            options = firstQuestion.options.map((_, index) => String.fromCharCode(65 + index));
                            optionsWithContent = firstQuestion.options.map((option, index) => {
                              let content = option.answer_content || option.content || '';
                              content = content.replace(/^<p[^>]*>|<\/p>$/gi, '').trim();
                              return {
                                letter: String.fromCharCode(65 + index),
                                content: content
                              };
                            });
                          }
                          // Fallback to metadata if options not found
                          else if (firstQuestion.metadata) {
                            const metadata = typeof firstQuestion.metadata === 'string' 
                              ? JSON.parse(firstQuestion.metadata) 
                              : firstQuestion.metadata;
                            
                            if (metadata.answers && Array.isArray(metadata.answers)) {
                              options = metadata.answers.map((_, index) => String.fromCharCode(65 + index));
                              optionsWithContent = metadata.answers.map((answer, index) => {
                                let content = answer.answer_content || answer.content || '';
                                content = content.replace(/^<p[^>]*>|<\/p>$/gi, '').trim();
                                return {
                                  letter: String.fromCharCode(65 + index),
                                  content: content
                                };
                              });
                            }
                          }
                        }
                        break;                  case 'yes_no_not_given':
                    options = (group.options && group.options.length > 0) 
                      ? group.options 
                      : ['Yes', 'No', 'Not Given'];
                    break;
                    
                  case 'true_false_not_given':
                    options = (group.options && group.options.length > 0) 
                      ? group.options 
                      : ['True', 'False', 'Not Given'];
                    break;
                    
                  case 'short_text':
                    // No options needed for text input
                    options = [];
                    break;
                    
                  default:
                    // Other types use group.options if available
                    options = (group.options && group.options.length > 0) ? group.options : [];
                    break;
                }
                
                allGroups.push({
                  id: group.id,
                  part: 1,
                  type: group.question_type || 'TRUE_FALSE_NOT_GIVEN',
                  instructions: group.instructions,
                  groupContent: group.content,
                  audioUrl: group.audio_url || sectionAudioUrl, // Use group audio or fall back to section audio
                  options: options,
                  optionsWithContent: optionsWithContent,
                  questions: questions,
                  startNumber: questions[0]?.number || 1,
                  endNumber: questions[questions.length - 1]?.number || 1,
                  layoutType: sectionLayoutType,
                  // Parse group instruction from content JSON
                  groupInstruction: (() => {
                    try {
                      if (group.content && typeof group.content === 'string') {
                        const parsed = JSON.parse(group.content);
                        return parsed.group_instruction || null;
                      }
                    } catch (e) {
                      return null;
                    }
                    return null;
                  })(),
                  sectionTitle: (() => {
                    try {
                      if (group.content && typeof group.content === 'string') {
                        const parsed = JSON.parse(group.content);
                        return parsed.section_title || null;
                      }
                    } catch (e) {
                      return null;
                    }
                    return null;
                  })()
                });
              });
            }
            setQuestionGroups(allGroups);
          }
        } else if (skillId) {
          // Lấy data cho full test (nhiều parts/sections)
          const response = await getSkillById(skillId, { with_sections: true });
          if (response.data.success) {
            const skill = response.data.data;
            setSkillData(skill);
            
            // Lấy tất cả question groups từ tất cả sections
            const allGroups = [];
            const allParts = [];
            let questionNumber = 1;
            
            if (skill.sections && skill.sections.length > 0) {
              skill.sections.forEach((section, sectionIndex) => {
                const partNumber = sectionIndex + 1;
                const groupStartIndex = allGroups.length;
                
                // Get layout type from section
                const sectionLayoutType = parseInt(section.ui_layer) || 1;
                
                // Get audio URL from section level
                const sectionAudioUrl = section.audio_url || null;
                
                // Lấy question groups
                if (section.question_groups) {
                  section.question_groups.forEach(group => {
                    const questions = [];
                    if (group.questions) {
                      group.questions.forEach((q) => {
                        questions.push({
                          id: q.id,
                          number: questionNumber++,
                          content: q.content,
                          correctAnswer: q.answer_content,
                          metadata: q.metadata
                        });
                      });
                    }
                    
                    // Parse options based on question_type
                    let options = [];
                    let optionsWithContent = null;
                    const questionType = (group.question_type || '').toLowerCase();
                    
                    switch (questionType) {
                      case 'multiple_choice':
                        // Get from question.options (new API format) or metadata.answers (old format)
                        if (group.questions && group.questions.length > 0) {
                          const firstQuestion = group.questions[0];
                          
                          // Check if options array exists directly on the question
                          if (firstQuestion.options && Array.isArray(firstQuestion.options) && firstQuestion.options.length > 0) {
                            options = firstQuestion.options.map((_, index) => String.fromCharCode(65 + index));
                            optionsWithContent = firstQuestion.options.map((option, index) => {
                              let content = option.answer_content || option.content || '';
                              content = content.replace(/^<p[^>]*>|<\/p>$/gi, '').trim();
                              return {
                                letter: String.fromCharCode(65 + index),
                                content: content
                              };
                            });
                          }
                          // Fallback to metadata if options not found
                          else if (firstQuestion.metadata) {
                            const metadata = typeof firstQuestion.metadata === 'string' 
                              ? JSON.parse(firstQuestion.metadata) 
                              : firstQuestion.metadata;
                            
                            if (metadata.answers && Array.isArray(metadata.answers)) {
                              options = metadata.answers.map((_, index) => String.fromCharCode(65 + index));
                              optionsWithContent = metadata.answers.map((answer, index) => {
                                let content = answer.answer_content || answer.content || '';
                                content = content.replace(/^<p[^>]*>|<\/p>$/gi, '').trim();
                                return {
                                  letter: String.fromCharCode(65 + index),
                                  content: content
                                };
                              });
                            }
                          }
                        }
                        break;
                        
                      case 'yes_no_not_given':
                        options = (group.options && group.options.length > 0) 
                          ? group.options 
                          : ['Yes', 'No', 'Not Given'];
                        break;
                        
                      case 'true_false_not_given':
                        options = (group.options && group.options.length > 0) 
                          ? group.options 
                          : ['True', 'False', 'Not Given'];
                        break;
                        
                      case 'short_text':
                        // No options needed for text input
                        options = [];
                        break;
                        
                      default:
                        // Other types use group.options if available
                        options = (group.options && group.options.length > 0) ? group.options : [];
                        break;
                    }
                    
                    allGroups.push({
                      id: group.id,
                      part: partNumber,
                      type: group.question_type || 'TRUE_FALSE_NOT_GIVEN',
                      instructions: group.instructions,
                      groupContent: group.content,
                      audioUrl: group.audio_url || sectionAudioUrl, // Use group audio or fall back to section audio
                      options: options,
                      optionsWithContent: optionsWithContent,
                      questions: questions,
                      startNumber: questions[0]?.number || questionNumber,
                      endNumber: questions[questions.length - 1]?.number || questionNumber,
                      layoutType: sectionLayoutType,
                      // Parse group instruction from content JSON
                      groupInstruction: (() => {
                        try {
                          if (group.content && typeof group.content === 'string') {
                            const parsed = JSON.parse(group.content);
                            return parsed.group_instruction || null;
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })(),
                      sectionTitle: (() => {
                        try {
                          if (group.content && typeof group.content === 'string') {
                            const parsed = JSON.parse(group.content);
                            return parsed.section_title || null;
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })()
                    });
                  });
                }
                
                const firstQuestionNum = allGroups[groupStartIndex]?.startNumber || questionNumber;
                const lastQuestionNum = allGroups[allGroups.length - 1]?.endNumber || questionNumber;
                allParts.push({
                  id: section.id,
                  part: partNumber,
                  title: `Part ${partNumber} (${firstQuestionNum}-${lastQuestionNum})`
                });
              });
              
              setParts(allParts);
            }
            
            setQuestionGroups(allGroups);
            
            // Set thời gian từ skill
            if (skill.time_limit) {
              setTimeRemaining(skill.time_limit * 60); // Convert minutes to seconds
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exam data:', error);
        alert('Không thể tải dữ liệu bài thi. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [skillId, sectionId]);

  // Xử lý chọn đáp án
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  // Xử lý nộp bài
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Chuẩn bị dữ liệu submit
      const answersArray = Object.entries(answers).map(([questionId, answerText]) => ({
        question_id: parseInt(questionId),
        answer_text: answerText
      }));

      const submitData = {
        exam_skill_id: parseInt(skillId),
        exam_section_id: sectionId ? parseInt(sectionId) : null,
        answers: answersArray,
        time_spent: (skillData?.time_limit * 60 || 2400) - timeRemaining
      };

      console.log('Submitting data:', submitData);

      // Gửi lên server
      const response = await fastapiService.submission.submitExam(submitData);
      
      console.log('Submit response:', response.data);
      
      message.success('Nộp bài thành công!');
      
      // Chuyển đến trang kết quả
      navigate(`/exams/result/${response.data.id}`);
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      message.error('Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#6B7280', marginBottom: '16px' }}>
            Đang tải dữ liệu bài thi...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!questionGroups || questionGroups.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#EF4444', marginBottom: '16px' }}>
            Không tìm thấy dữ liệu bài thi
          </div>
        </div>
      </div>
    );
  }

  const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);
  const currentPartAudio = currentPartGroups[0]?.audioUrl || sectionData?.audio_url || null;
  
  console.log('Current Part Groups:', currentPartGroups);
  console.log('Current Part Audio URL:', currentPartAudio);
  console.log('Section Data Audio:', sectionData?.audio_url);

  // Render câu hỏi dựa trên loại question type
  const renderQuestionsByType = (group, answers, handleAnswerSelect) => {
    const questionType = (group.type || '').toLowerCase();

    // 1. DẠNG SHORT_TEXT/SHORT_ANSWER - Điền vào chỗ trống
    const hasPlaceholders = containsInlinePlaceholders(group.groupContent);
    
    if (questionType === 'short_text' || questionType === 'short_answer' || hasPlaceholders) {
      // Case 1: Has inline placeholders in groupContent
      if (hasPlaceholders) {
        return (
          <div className="listening-test__question-group-with-inputs">
            <GroupContentWithInlineInputs
              content={group.groupContent}
              questions={group.questions}
              answers={answers}
              onAnswerChange={handleAnswerSelect}
            />
          </div>
        );
      }
      
      // Case 2: Regular short answer questions (one input per question)
      return group.questions.map((question) => (
        <div key={question.id} className="listening-test__question-item listening-test__question-item--input">
          <div className="listening-test__question-row">
            <div className="listening-test__question-number">
              {question.number}
            </div>
            <div
              className="listening-test__question-text"
              dangerouslySetInnerHTML={{ __html: question.content }}
            />
          </div>
          <div className="listening-test__answer-input-wrapper">
            <input
              type="text"
              className="listening-test__answer-input"
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
      ));
    }

    // 2. DẠNG MULTIPLE_CHOICE - Render với optionsWithContent
    if (questionType === 'multiple_choice') {
      return group.questions.map((question) => {
        // Parse question content to extract the actual question text (remove options from content)
        let questionText = question.content || '';
        // Remove everything after the first line break or the pattern "A. "
        const lines = questionText.split('\n');
        questionText = lines[0]; // Take only the first line as question text
        
        return (
          <div key={question.id} className="listening-test__question-item">
            <div className="listening-test__question-row">
              <div className="listening-test__question-number">{question.number}</div>
              <div className="listening-test__question-text" dangerouslySetInnerHTML={{ __html: questionText }} />
            </div>
            <div className="listening-test__options">
              {(group.optionsWithContent || []).map((option) => (
                <label key={option.letter} className={`listening-test__option ${answers[question.id] === option.letter ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.letter}
                    checked={answers[question.id] === option.letter}
                    onChange={() => handleAnswerSelect(question.id, option.letter)}
                  />
                  <span className="listening-test__option-text">
                    <strong style={{ marginRight: '8px' }}>{option.letter}.</strong>
                    <span dangerouslySetInnerHTML={{ __html: option.content }} style={{ display: 'inline' }} />
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      });
    }

    // 3. DẠNG CÒN LẠI - Render radio buttons với group.options
    // Áp dụng cho: yes_no_not_given, true_false_not_given, và các loại khác
    return group.questions.map((question) => (
      <div key={question.id} className="listening-test__question-item">
        <div className="listening-test__question-row">
          <div className="listening-test__question-number">{question.number}</div>
          <div className="listening-test__question-text" dangerouslySetInnerHTML={{ __html: question.content }} />
        </div>
        {group.options && group.options.length > 0 && (
          <div className="listening-test__options">
            {group.options.map((option) => (
              <label key={option} className={`listening-test__option ${answers[question.id] === option ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswerSelect(question.id, option)}
                />
                <span className="listening-test__option-text">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <TestLayout
      examData={examData}
      skillData={skillData}
      sectionData={sectionData}
      timeRemaining={timeRemaining}
      setTimeRemaining={setTimeRemaining}
      parts={parts}
      currentPartTab={currentPartTab}
      setCurrentPartTab={setCurrentPartTab}
      questionGroups={questionGroups}
      answers={answers}
      onSubmit={handleSubmit}
      showQuestionNumbers={true}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      submitting={submitting}
    >
      {/* Audio Player - Fixed at top */}
      {currentPartAudio && (
        <div className="listening-test__audio-section">
       
          <audio
            ref={audioRef}
            controls
            src={currentPartAudio}
            className="listening-test__audio-player"
          />
        </div>
      )}

      <div className={`listening-test__content ${fontSize !== 'normal' ? `listening-test__content--${fontSize}` : ''} ${currentPartGroups[0]?.layoutType === 2 ? 'listening-test__content--two-column' : ''}`}>
        {/* Layout Type 2: Two Column Layout */}
        {currentPartGroups[0]?.layoutType === 2 ? (
          <>
            {/* Left Column: Content/Images Only */}
            <div className="listening-test__left-column">
         
              {currentPartGroups.map((group) => (
                <div key={group.id} className="listening-test__content-section">
                       <h2>Listening Part {currentPartTab}</h2> 
                  {group.groupContent && !containsInlinePlaceholders(group.groupContent) && (
                    <div
                      className="listening-test__group-content"
                      dangerouslySetInnerHTML={{ __html: group.groupContent }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Right Column: Headers + Questions */}
            <div className="listening-test__right-column">
              {currentPartGroups.map((group) => (
                <div key={group.id} id={`question-group-${group.id}`} className="listening-test__question-group">
                  <div className="listening-test__group-header">
                    <h3>Question {group.startNumber} - {group.endNumber}</h3>
                    {group.groupInstruction && (
                      <div className="listening-test__group-instructions">
                        {group.groupInstruction}
                      </div>
                    )}
                    {group.sectionTitle && (
                      <div className="listening-test__section-title">
                        {group.sectionTitle}
                      </div>
                    )}
                  </div>
                  <div className="listening-test__questions-list">
                    {renderQuestionsByType(group, answers, handleAnswerSelect)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Layout Type 1: Default Single Column Layout */
          <>
            {currentPartGroups.map((group) => (
              <div key={group.id} id={`question-group-${group.id}`} className="listening-test__question-group">
                {/* Group Header */}
                <h2>Listening Part {currentPartTab}</h2> 
                <div className="listening-test__group-header">
                  <h3>Question {group.startNumber} - {group.endNumber}</h3>
                  {group.groupInstruction && (
                    <div className="listening-test__group-instructions">
                      {group.groupInstruction}
                    </div>
                  )}
                  {group.sectionTitle && (
                    <div className="listening-test__section-title">
                      {group.sectionTitle}
                    </div>
                  )}
                </div>

                {/* Group Content */}
                {group.groupContent && !containsInlinePlaceholders(group.groupContent) && !isJSONString(group.groupContent) && (
                  <div
                    className="listening-test__group-content"
                    dangerouslySetInnerHTML={{ __html: group.groupContent }}
                  />
                )}

                {/* Questions */}
                <div className="listening-test__questions-list">
                  {renderQuestionsByType(group, answers, handleAnswerSelect)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </TestLayout>
  );
};

export default ListeningTest;
