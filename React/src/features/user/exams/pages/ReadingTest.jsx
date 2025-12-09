import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getSkillById, getSectionById } from '../api/exams.api';
import TestLayout from '../components/TestLayout';
import './ReadingTest.css';

const containsInlinePlaceholders = (text) => /\{\{\s*[a-zA-Z0-9]+\s*\}\}/.test(text || '');

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
      return `<span class="reading-test__inline-placeholder" data-placeholder-id="${placeholderId}"></span>`;
    });

    container.innerHTML = processedContent;

    placeholderMeta.forEach((meta) => {
      const placeholderElement = container.querySelector(`[data-placeholder-id="${meta.placeholderId}"]`);
      if (!placeholderElement) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'reading-test__inline-input';
      input.placeholder = meta.question.number?.toString() || '';
      input.maxLength = 50;
      input.dataset.questionId = meta.question.id;

      const handleInput = (event) => {
        latestHandlerRef.current?.(meta.question.id, event.target.value);
      };

      const stopPropagation = (event) => event.stopPropagation();

      input.addEventListener('input', handleInput);
      input.addEventListener('focus', stopPropagation);
      input.addEventListener('click', stopPropagation);

      const wrapper = document.createElement('span');
      wrapper.className = 'reading-test__inline-input-wrapper';
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
      className="reading-test__group-content-parsed"
      ref={containerRef}
    />
  );
};

export default function ReadingTest() {
  const { skillId, sectionId } = useParams();
  const location = useLocation();
  const examData = location.state?.examData;

  // State để quản lý câu hỏi hiện tại và câu trả lời
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 phút = 1800 giây
  const [currentPartTab, setCurrentPartTab] = useState(1); // Tab hiện tại
  const [loading, setLoading] = useState(true);
  const [skillData, setSkillData] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [questionGroups, setQuestionGroups] = useState([]); // Lưu theo groups
  const [passages, setPassages] = useState([]); // Nhiều passages theo part
  const [parts, setParts] = useState([]); // Danh sách các parts
  const [fontSize, setFontSize] = useState('normal'); // Font size

  // Lấy dữ liệu từ API
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
            
            // Lấy passage content từ section
            setPassages([{
              id: section.id,
              part: 1,
              title: section.title || 'Reading Passage',
              subtitle: '',
              content: section.content || ''
            }]);
            
            setParts([{ id: section.id, part: 1, title: `Part 1 (1-${section.question_groups?.reduce((sum, g) => sum + (g.questions?.length || 0), 0) || 0})` }]);
            
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
                    // Get from metadata.answers
                    if (group.questions && group.questions.length > 0) {
                      const firstQuestion = group.questions[0];
                      if (firstQuestion.metadata) {
                        const metadata = typeof firstQuestion.metadata === 'string' 
                          ? JSON.parse(firstQuestion.metadata) 
                          : firstQuestion.metadata;
                        
                        if (metadata.answers && Array.isArray(metadata.answers)) {
                          options = metadata.answers.map((_, index) => String.fromCharCode(65 + index));
                          optionsWithContent = metadata.answers.map((answer, index) => {
                            let content = answer.content || '';
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
                  part: 1,
                  type: group.question_type || 'TRUE_FALSE_NOT_GIVEN',
                  groupContent: group.content,
                  options: options,
                  optionsWithContent: optionsWithContent,
                  questions: questions,
                  startNumber: questions[0]?.number || 1,
                  endNumber: questions[questions.length - 1]?.number || 1
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
            const allPassages = [];
            const allParts = [];
            let questionNumber = 1;
            
            if (skill.sections && skill.sections.length > 0) {
              skill.sections.forEach((section, sectionIndex) => {
                const partNumber = sectionIndex + 1;
                const groupStartIndex = allGroups.length;
                
                // Lưu passage cho mỗi part
                allPassages.push({
                  id: section.id,
                  part: partNumber,
                  title: section.title || `Reading Passage ${partNumber}`,
                  subtitle: '',
                  content: section.content || ''
                });
                
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
                        // Get from metadata.answers
                        if (group.questions && group.questions.length > 0) {
                          const firstQuestion = group.questions[0];
                          if (firstQuestion.metadata) {
                            const metadata = typeof firstQuestion.metadata === 'string' 
                              ? JSON.parse(firstQuestion.metadata) 
                              : firstQuestion.metadata;
                            
                            if (metadata.answers && Array.isArray(metadata.answers)) {
                              options = metadata.answers.map((_, index) => String.fromCharCode(65 + index));
                              optionsWithContent = metadata.answers.map((answer, index) => {
                                let content = answer.content || '';
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
                      groupContent: group.content,
                      options: options,
                      optionsWithContent: optionsWithContent,
                      questions: questions,
                      startNumber: questions[0]?.number || questionNumber,
                      endNumber: questions[questions.length - 1]?.number || questionNumber
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
              
              setPassages(allPassages);
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
  const handleSubmit = () => {
    // TODO: Gửi kết quả về server
    const result = {
      skillId,
      sectionId,
      answers,
      timeSpent: (skillData?.time_limit * 60 || 1800) - timeRemaining
    };
    console.log('Submit result:', result);
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
  if (!passages || passages.length === 0 || questionGroups.length === 0) {
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

  const currentPassage = passages.find(p => p.part === currentPartTab) || passages[0];
  const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);

  // Render câu hỏi dựa trên loại question type
  const renderQuestionsByType = (group, answers, handleAnswerSelect) => {
    const questionType = (group.type || '').toLowerCase();

    // 1. DẠNG SHORT_TEXT - Điền vào chỗ trống inline (có {{ placeholders }})
    const hasPlaceholders = containsInlinePlaceholders(group.groupContent);
    if (hasPlaceholders || questionType === 'short_text') {
      if (hasPlaceholders) {
        return (
          <div className="reading-test__question-group-with-inputs">
            <GroupContentWithInlineInputs
              content={group.groupContent}
              questions={group.questions}
              answers={answers}
              onAnswerChange={handleAnswerSelect}
            />
          </div>
        );
      }
      
      return group.questions.map((question) => (
        <div key={question.id} className="reading-test__question-item reading-test__question-item--input">
          <div className="reading-test__question-row">
            <div className="reading-test__question-number">
              {question.number}
            </div>
            <div
              className="reading-test__question-text"
              dangerouslySetInnerHTML={{ __html: question.content }}
            />
          </div>
          <div className="reading-test__answer-input-wrapper">
            <input
              type="text"
              className="reading-test__answer-input"
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
      return group.questions.map((question) => (
        <div key={question.id} className="reading-test__question-item">
          <div className="reading-test__question-row">
            <div className="reading-test__question-number">{question.number}</div>
            <div className="reading-test__question-text" dangerouslySetInnerHTML={{ __html: question.content || '' }} />
          </div>
          <div className="reading-test__options">
            {(group.optionsWithContent || []).map((option) => (
              <label key={option.letter} className={`reading-test__option ${answers[question.id] === option.letter ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.letter}
                  checked={answers[question.id] === option.letter}
                  onChange={() => handleAnswerSelect(question.id, option.letter)}
                />
                <span className="reading-test__option-text">
                  <strong style={{ marginRight: '8px' }}>{option.letter}.</strong>
                  <span dangerouslySetInnerHTML={{ __html: option.content }} style={{ display: 'inline' }} />
                </span>
              </label>
            ))}
          </div>
        </div>
      ));
    }

    // 3. DẠNG CÒN LẠI - Render radio buttons với group.options
    // Áp dụng cho: yes_no_not_given, true_false_not_given
    return group.questions.map((question) => (
      <div key={question.id} className="reading-test__question-item">
        <div className="reading-test__question-row">
          <div className="reading-test__question-number">{question.number}</div>
          <div className="reading-test__question-text" dangerouslySetInnerHTML={{ __html: question.content }} />
        </div>
        {group.options && group.options.length > 0 && (
          <div className="reading-test__options">
            {group.options.map((option) => (
              <label key={option} className={`reading-test__option ${answers[question.id] === option ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswerSelect(question.id, option)}
                />
                <span className="reading-test__option-text">{option}</span>
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
    >
      {/* Main Content - Passage và Questions */}
      <div className="reading-test__content-wrapper">
        {/* Passage Panel */}
        <div className="reading-test__passage">
          <div className="reading-test__passage-header">
            <h2 className="reading-test__passage-title">{currentPassage.title}</h2>
            {currentPassage.subtitle && (
              <p className="reading-test__passage-subtitle">{currentPassage.subtitle}</p>
            )}
          </div>
          <div 
            className={`reading-test__passage-content reading-test__passage-content--${fontSize}`}
            dangerouslySetInnerHTML={{ __html: currentPassage.content }}
          />
        </div>

        {/* Questions Panel */}
        <div className={`reading-test__questions reading-test__questions--${fontSize}`}>
          {currentPartGroups.map((group) => (
            <div key={group.id} id={`question-group-${group.id}`} className="reading-test__question-group">
              {/* Group Header */}
              <div className="reading-test__group-header">
                <h3>Questions {group.startNumber} - {group.endNumber}</h3>
              </div>

              {/* Group Content */}
              {group.groupContent && !containsInlinePlaceholders(group.groupContent) && (
                <div
                  className="reading-test__group-content"
                  dangerouslySetInnerHTML={{ __html: group.groupContent }}
                />
              )}

              {/* Questions */}
              <div className="reading-test__questions-list">
                {renderQuestionsByType(group, answers, handleAnswerSelect)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TestLayout>
  );
}
