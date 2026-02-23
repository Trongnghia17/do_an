import { useState, useEffect, useRef, memo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getTestResult, getSkillById, getSectionById } from '../api/exams.api';
import TestLayout from '../components/TestLayout';
import { Modal } from 'antd';
import './ReadingTest.css'; // Sử dụng cùng CSS với ReadingTest
import './TestResultReview.css'; // CSS riêng cho review mode

const containsInlinePlaceholders = (text) => /\{\{\s*[a-zA-Z0-9]+\s*\}\}/.test(text || '');

// Component hiển thị group content với inline inputs ở chế độ review (readonly)
const GroupContentWithInlineInputsReview = ({ content, questions = [], userAnswers = {} }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!content) {
      container.innerHTML = '';
      return;
    }

    const placeholderRegex = /\{\{\s*([a-zA-Z0-9]+)\s*\}\}/g;
    let questionIndex = 0;

    const processedContent = content.replace(placeholderRegex, (match) => {
      const question = questions[questionIndex];
      questionIndex += 1;

      if (!question) {
        return match;
      }

      const answerData = userAnswers[question.id] || {};
      const isCorrect = answerData.isCorrect;
      const userAnswer = answerData.userAnswer || '';
      const correctAnswer = answerData.correctAnswer || question.correctAnswer || '';

      const placeholderId = `inline-placeholder-review-${question.id}`;
      const colorClass = isCorrect ? 'correct' : 'incorrect';
      
      return `<span class="reading-test__inline-placeholder" data-placeholder-id="${placeholderId}" data-is-correct="${isCorrect}" data-user-answer="${userAnswer}" data-correct-answer="${correctAnswer}"></span>`;
    });

    container.innerHTML = processedContent;

    // Thay thế placeholders bằng inputs readonly
    questions.forEach((question) => {
      const placeholderId = `inline-placeholder-review-${question.id}`;
      const placeholderElement = container.querySelector(`[data-placeholder-id="${placeholderId}"]`);
      if (!placeholderElement) return;

      const answerData = userAnswers[question.id] || {};
      const isCorrect = answerData.isCorrect;
      const userAnswer = answerData.userAnswer || '';
      const correctAnswer = answerData.correctAnswer || question.correctAnswer || '';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = `reading-test__inline-input review-inline-input ${isCorrect ? 'correct' : 'incorrect'}`;
      input.value = userAnswer || '';
      input.disabled = true;
      input.readOnly = true;
      input.title = isCorrect ? `Đúng: ${userAnswer}` : `Sai - Đáp án đúng: ${correctAnswer}`;

      const wrapper = document.createElement('span');
      wrapper.className = 'reading-test__inline-input-wrapper';
      wrapper.appendChild(input);

      // Thêm đáp án đúng nếu sai
      if (!isCorrect && correctAnswer) {
        const correctAnswerSpan = document.createElement('span');
        correctAnswerSpan.className = 'review-inline-correct-answer';
        correctAnswerSpan.textContent = `(Đáp án: ${correctAnswer})`;
        wrapper.appendChild(correctAnswerSpan);
      }

      placeholderElement.replaceWith(wrapper);
    });
  }, [content, questions, userAnswers]);

  return <div ref={containerRef} className="reading-test__group-content-with-inputs" />;
};

// Component hiển thị passage content
const PassageContent = memo(function PassageContent({ fontSize, content }) {
  return (
    <div
      className={`reading-test__passage-content reading-test__passage-content--${fontSize}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
});

// Component Modal hiển thị giải thích chi tiết
const ExplanationModal = ({ visible, onClose, question, userAnswer, correctAnswer, isCorrect }) => {
  return (
    <Modal
      title={
        <div style={{ 
          borderBottom: '1px solid #E7E7E7', 
          paddingBottom: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1F2937',
            marginBottom: '8px'
          }}>
            Giải thích chi tiết - Câu {question?.number}
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6B7280',
            fontWeight: 400
          }}>
            Xem phân tích chi tiết về câu hỏi và đáp án
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      className="explanation-modal"
    >
      {question && (
        <div className="explanation-modal-content">
          {/* Câu hỏi */}
          <div className="explanation-section">
            <div className="explanation-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12M12 8H12.01" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Câu hỏi
            </div>
            <div 
              className="explanation-section-content"
              dangerouslySetInnerHTML={{ __html: question.content }}
            />
          </div>

          {/* Đáp án của bạn */}
          <div className="explanation-section">
            <div className="explanation-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={isCorrect ? "#35A815" : "#EF4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Đáp án của bạn
            </div>
            <div className="explanation-section-content">
              <span className={`explanation-answer-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                {userAnswer || <em>(Chưa trả lời)</em>}
              </span>
              {isCorrect ? (
                <span className="explanation-status-text correct">✓ Chính xác</span>
              ) : (
                <span className="explanation-status-text incorrect">✗ Chưa chính xác</span>
              )}
            </div>
          </div>

          {/* Đáp án đúng */}
          {!isCorrect && (
            <div className="explanation-section">
              <div className="explanation-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#35A815" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Đáp án đúng
              </div>
              <div className="explanation-section-content">
                <span className="explanation-answer-badge correct">
                  {correctAnswer}
                </span>
              </div>
            </div>
          )}

          {/* Giải thích */}
          {question.explanation && (
            <div className="explanation-section">
              <div className="explanation-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Giải thích
              </div>
              <div 
                className="explanation-section-content explanation-text"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            </div>
          )}

          {/* Locate hint */}
          {question.locateText && (
            <div className="explanation-section">
              <div className="explanation-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#045CCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Vị trí trong bài đọc
              </div>
              <div className="explanation-section-content">
                <div className="explanation-locate-text">
                  {question.locateText}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default function TestResultReview() {
  const { resultId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const resultFromState = location.state?.result;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(resultFromState || null);
  const [skillData, setSkillData] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [passages, setPassages] = useState([]);
  const [parts, setParts] = useState([]);
  const [currentPartTab, setCurrentPartTab] = useState(1);
  const [fontSize, setFontSize] = useState('normal');
  const [timeRemaining] = useState(0); // No timer in review mode
  const [expandedExplanations, setExpandedExplanations] = useState({});
  const [userAnswers, setUserAnswers] = useState({}); // Store user's answers from result
  
  // Modal state
  const [explanationModalVisible, setExplanationModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch test result if not in state
        let testResult = result;
        if (!testResult) {
          const response = await getTestResult(resultId);
          if (response.data.success) {
            testResult = response.data.data;
            setResult(testResult);
          }
        }

        if (!testResult) {
          throw new Error('No test result found');
        }

        // Build user answers map from result
        const answersMap = {};
        if (testResult.answers && Array.isArray(testResult.answers)) {
          testResult.answers.forEach(ans => {
            answersMap[ans.question_id] = {
              userAnswer: ans.user_answer,
              correctAnswer: ans.correct_answer,
              isCorrect: ans.is_correct
            };
          });
        }
        setUserAnswers(answersMap);

        // Fetch exam data based on result
        if (testResult.exam_skill_id) {
          const response = await getSkillById(testResult.exam_skill_id, { with_sections: true });
          if (response.data.success) {
            setSkillData(response.data.data);
            processExamData(response.data.data, testResult, 'skill');
          }
        } else if (testResult.exam_section_id) {
          const response = await getSectionById(testResult.exam_section_id, { with_questions: true });
          if (response.data.success) {
            setSectionData(response.data.data);
            processExamData(response.data.data, testResult, 'section');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Không thể tải dữ liệu. Vui lòng thử lại.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId]);

  const processExamData = (data, testResult, type) => {
    if (type === 'section') {
      // Process single section
      const section = data;
      
      setPassages([{
        id: section.id,
        part: 1,
        title: section.title || 'Reading Passage',
        subtitle: '',
        content: section.content || ''
      }]);
      
      setParts([{ 
        id: section.id, 
        part: 1, 
        title: `Part 1 (1-${section.question_groups?.reduce((sum, g) => sum + (g.questions?.length || 0), 0) || 0})` 
      }]);
      
      const allGroups = [];
      let questionNumber = 1;
      
      if (section.question_groups) {
        section.question_groups.forEach(group => {
          const questions = [];
          if (group.questions) {
            group.questions.forEach((q) => {
              // Parse metadata to get explanation from answers[].feedback
              let explanation = '';
              let locateText = '';
              if (q.metadata) {
                const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
                
                // Get feedback from metadata.answers array
                if (metadata.answers && Array.isArray(metadata.answers)) {
                  const correctAnswer = metadata.answers.find(a => a.is_correct === "1" || a.is_correct === 1 || a.is_correct === true);
                  if (correctAnswer && correctAnswer.feedback) {
                    explanation = correctAnswer.feedback;
                  }
                }
                
                // Fallback to other fields
                explanation = explanation || metadata.explanation || metadata.feedback || q.feedback || '';
                locateText = metadata.locate || metadata.hint || q.hint || '';
                
                // Debug log
                console.log('Question', q.id, '- Explanation:', explanation);
              }

              questions.push({
                id: q.id,
                number: questionNumber++,
                content: q.content,
                correctAnswer: q.answer_content,
                metadata: q.metadata,
                explanation: explanation,
                locateText: locateText
              });
            });
          }
          
          let options = [];
          let optionsWithContent = null;
          const questionType = (group.question_type || '').toLowerCase();
          
          switch (questionType) {
            case 'multiple_choice':
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
              options = [];
              break;
              
            default:
              options = (group.options && group.options.length > 0) ? group.options : [];
              break;
          }
          
          allGroups.push({
            id: group.id,
            part: 1,
            type: group.question_type || 'TRUE_FALSE_NOT_GIVEN',
            instructions: group.instructions,
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
      
    } else if (type === 'skill') {
      // Process full skill (multiple sections)
      const skill = data;
      const allGroups = [];
      const allPassages = [];
      const allParts = [];
      let questionNumber = 1;
      
      if (skill.sections && skill.sections.length > 0) {
        skill.sections.forEach((section, sectionIndex) => {
          const partNumber = sectionIndex + 1;
          const groupStartIndex = allGroups.length;
          
          allPassages.push({
            id: section.id,
            part: partNumber,
            title: section.title || `Reading Passage ${partNumber}`,
            subtitle: '',
            content: section.content || ''
          });
          
          if (section.question_groups) {
            section.question_groups.forEach(group => {
              const questions = [];
              if (group.questions) {
                group.questions.forEach((q) => {
                  // Parse metadata to get explanation from answers[].feedback
                  let explanation = '';
                  let locateText = '';
                  if (q.metadata) {
                    const metadata = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
                    
                    // Get feedback from metadata.answers array
                    if (metadata.answers && Array.isArray(metadata.answers)) {
                      const correctAnswer = metadata.answers.find(a => a.is_correct === "1" || a.is_correct === 1 || a.is_correct === true);
                      if (correctAnswer && correctAnswer.feedback) {
                        explanation = correctAnswer.feedback;
                      }
                    }
                    
                    // Fallback to other fields
                    explanation = explanation || metadata.explanation || metadata.feedback || q.feedback || '';
                    locateText = metadata.locate || metadata.hint || q.hint || '';
                  }

                  questions.push({
                    id: q.id,
                    number: questionNumber++,
                    content: q.content,
                    correctAnswer: q.answer_content,
                    metadata: q.metadata,
                    explanation: explanation,
                    locateText: locateText
                  });
                });
              }
              
              let options = [];
              let optionsWithContent = null;
              const questionType = (group.question_type || '').toLowerCase();
              
              switch (questionType) {
                case 'multiple_choice':
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
                  options = [];
                  break;
                  
                default:
                  options = (group.options && group.options.length > 0) ? group.options : [];
                  break;
              }
              
              allGroups.push({
                id: group.id,
                part: partNumber,
                type: group.question_type || 'TRUE_FALSE_NOT_GIVEN',
                instructions: group.instructions,
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
    }
  };

  const toggleExplanation = (questionId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleLocate = (locateText) => {
    if (!locateText) return;
    
    // TODO: Implement highlight logic in passage
    console.log('Locate:', locateText);
    alert(`Locate: ${locateText}`);
  };

  const showExplanationModal = (question) => {
    setSelectedQuestion(question);
    setExplanationModalVisible(true);
  };

  const closeExplanationModal = () => {
    setExplanationModalVisible(false);
    setSelectedQuestion(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#6B7280', marginBottom: '16px' }}>
            Đang tải dữ liệu...
          </div>
        </div>
      </div>
    );
  }

  if (!passages || passages.length === 0 || questionGroups.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#EF4444', marginBottom: '16px' }}>
            Không tìm thấy dữ liệu
          </div>
        </div>
      </div>
    );
  }

  const currentPassage = passages.find(p => p.part === currentPartTab) || passages[0];
  const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);

  // Render câu hỏi ở chế độ review (readonly with colors)
  const renderReviewQuestions = (group) => {
    const questionType = (group.type || '').toLowerCase();

    // SHORT_TEXT
    const hasPlaceholders = containsInlinePlaceholders(group.groupContent);
    if (hasPlaceholders || questionType === 'short_text') {
      // Dạng 1: Inline placeholders trong group content
      if (hasPlaceholders) {
        return (
          <div className="reading-test__question-group-with-inputs">
            <GroupContentWithInlineInputsReview
              content={group.groupContent}
              questions={group.questions}
              userAnswers={userAnswers}
            />
            {/* Show explanations for each question - ALWAYS visible */}
            {group.questions.map((question) => (
              <div key={question.id} style={{ marginTop: '12px' }}>
                {/* Explanation - Always show if exists */}
                {question.explanation && (
                  <div className="review-explanation-section">
                    <strong>Giải thích câu {question.number}:</strong>
                    <div 
                      className="review-explanation-text"
                      dangerouslySetInnerHTML={{ __html: question.explanation }}
                    />
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="review-actions" style={{ marginTop: '8px' }}>
                  {question.locateText && (
                    <button 
                      className="review-action-btn review-locate-btn"
                      onClick={() => handleLocate(question.locateText)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                      Locate
                    </button>
                  )}
                  
                  {question.explanation && (
                    <button
                      className="review-action-btn review-explain-btn"
                      onClick={() => showExplanationModal(question)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                        <path d="M4.16667 6.66667H5C5.22101 6.66667 5.43297 6.57887 5.58926 6.42259C5.74554 6.26631 5.83333 6.05435 5.83333 5.83333C5.83333 5.61232 5.74554 5.40036 5.58926 5.24408C5.43297 5.0878 5.22101 5 5 5H4.16667C3.94565 5 3.73369 5.0878 3.57741 5.24408C3.42113 5.40036 3.33333 5.61232 3.33333 5.83333C3.33333 6.05435 3.42113 6.26631 3.57741 6.42259C3.73369 6.57887 3.94565 6.66667 4.16667 6.66667ZM7.5 11.6667H4.16667C3.94565 11.6667 3.73369 11.7545 3.57741 11.9107C3.42113 12.067 3.33333 12.279 3.33333 12.5C3.33333 12.721 3.42113 12.933 3.57741 13.0893C3.73369 13.2455 3.94565 13.3333 4.16667 13.3333H7.5C7.72101 13.3333 7.93297 13.2455 8.08926 13.0893C8.24554 12.933 8.33333 12.721 8.33333 12.5C8.33333 12.279 8.24554 12.067 8.08926 11.9107C7.93297 11.7545 7.72101 11.6667 7.5 11.6667ZM7.5 8.33333H4.16667C3.94565 8.33333 3.73369 8.42113 3.57741 8.57741C3.42113 8.73369 3.33333 8.94565 3.33333 9.16667C3.33333 9.38768 3.42113 9.59964 3.57741 9.75592C3.73369 9.9122 3.94565 10 4.16667 10H7.5C7.72101 10 7.93297 9.9122 8.08926 9.75592C8.24554 9.59964 8.33333 9.38768 8.33333 9.16667C8.33333 8.94565 8.24554 8.73369 8.08926 8.57741C7.93297 8.42113 7.72101 8.33333 7.5 8.33333ZM13.2667 6.15C13.3305 5.99824 13.3479 5.83098 13.3168 5.66932C13.2856 5.50766 13.2073 5.35885 13.0917 5.24167L8.09167 0.241667C8.02278 0.176847 7.94402 0.123401 7.85833 0.0833333C7.83346 0.0798001 7.80821 0.0798001 7.78333 0.0833333L7.55 0H2.5C1.83696 0 1.20107 0.263392 0.732233 0.732233C0.263392 1.20107 0 1.83696 0 2.5V14.1667C0 14.8297 0.263392 15.4656 0.732233 15.9344C1.20107 16.4033 1.83696 16.6667 2.5 16.6667H7.5C7.72101 16.6667 7.93297 16.5789 8.08926 16.4226C8.24554 16.2663 8.33333 16.0543 8.33333 15.8333C8.33333 15.6123 8.24554 15.4004 8.08926 15.2441C7.93297 15.0878 7.72101 15 7.5 15H2.5C2.27899 15 2.06702 14.9122 1.91074 14.7559C1.75446 14.5996 1.66667 14.3877 1.66667 14.1667V2.5C1.66667 2.27899 1.75446 2.06702 1.91074 1.91074C2.06702 1.75446 2.27899 1.66667 2.5 1.66667H6.66667V4.16667C6.66667 4.82971 6.93006 5.46559 7.3989 5.93443C7.86774 6.40327 8.50362 6.66667 9.16667 6.66667H12.5C12.6645 6.66585 12.8251 6.61634 12.9616 6.5244C13.098 6.43245 13.2041 6.30218 13.2667 6.15ZM9.16667 5C8.94565 5 8.73369 4.9122 8.57741 4.75592C8.42113 4.59964 8.33333 4.38768 8.33333 4.16667V2.84167L10.4917 5H9.16667ZM15 8.33333H10.8333C10.6123 8.33333 10.4004 8.42113 10.2441 8.57741C10.0878 8.73369 10 8.94565 10 9.16667V15.8333C10.0004 15.9841 10.0417 16.1319 10.1195 16.261C10.1972 16.3902 10.3086 16.4958 10.4417 16.5667C10.572 16.6336 10.7176 16.665 10.8639 16.6576C11.0102 16.6503 11.152 16.6046 11.275 16.525L12.9167 15.4417L14.5833 16.525C14.7078 16.597 14.8488 16.6356 14.9926 16.6369C15.1364 16.6383 15.2782 16.6024 15.404 16.5328C15.5298 16.4631 15.6355 16.3621 15.7107 16.2396C15.786 16.117 15.8282 15.9771 15.8333 15.8333V9.16667C15.8333 8.94565 15.7455 8.73369 15.5893 8.57741C15.433 8.42113 15.221 8.33333 15 8.33333ZM14.1667 14.2667L13.3833 13.7417C13.2455 13.6485 13.083 13.5987 12.9167 13.5987C12.7503 13.5987 12.5878 13.6485 12.45 13.7417L11.6667 14.2667V10H14.1667V14.2667Z" fill="#045CCE"/>
                      </svg>
                      Giải thích chi tiết
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }
      
      // Dạng 2: Standalone inputs (mỗi câu hỏi có input riêng)
      return group.questions.map((question) => {
        const answerData = userAnswers[question.id] || {};
        const isCorrect = answerData.isCorrect;
        const userAnswer = answerData.userAnswer || '';
        const correctAnswer = answerData.correctAnswer || question.correctAnswer;

        return (
          <div key={question.id} className="reading-test__question-item reading-test__question-item--review">
            <div className="reading-test__question-row">
              <div className="reading-test__question-number">{question.number}.</div>
              <div
                className="reading-test__question-text"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
            </div>
            
            {/* User's text input answer */}
            <div className="review-text-answer-wrapper">
              <input
                type="text"
                className={`review-text-answer ${isCorrect ? 'correct' : 'incorrect'}`}
                value={userAnswer || ''}
                disabled
                readOnly
                placeholder={userAnswer ? '' : '(Chưa trả lời)'}
              />
              
              {/* Show correct answer if wrong */}
              {!isCorrect && (
                <div className="review-correct-answer">
                  Đáp án đúng: {correctAnswer}
                </div>
              )}
            </div>

            {/* Explanation Section - Always visible */}
            {question.explanation && (
              <div className="review-explanation-section">
                <strong>Giải thích:</strong>
                <div 
                  className="review-explanation-text"
                  dangerouslySetInnerHTML={{ __html: question.explanation }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="review-actions">
              {question.locateText && (
                <button 
                  className="review-action-btn review-locate-btn"
                  onClick={() => handleLocate(question.locateText)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Locate
                </button>
              )}
              
              {question.explanation && (
                <button
                  className="review-action-btn review-explain-btn"
                  onClick={() => showExplanationModal(question)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                    <path d="M4.16667 6.66667H5C5.22101 6.66667 5.43297 6.57887 5.58926 6.42259C5.74554 6.26631 5.83333 6.05435 5.83333 5.83333C5.83333 5.61232 5.74554 5.40036 5.58926 5.24408C5.43297 5.0878 5.22101 5 5 5H4.16667C3.94565 5 3.73369 5.0878 3.57741 5.24408C3.42113 5.40036 3.33333 5.61232 3.33333 5.83333C3.33333 6.05435 3.42113 6.26631 3.57741 6.42259C3.73369 6.57887 3.94565 6.66667 4.16667 6.66667ZM7.5 11.6667H4.16667C3.94565 11.6667 3.73369 11.7545 3.57741 11.9107C3.42113 12.067 3.33333 12.279 3.33333 12.5C3.33333 12.721 3.42113 12.933 3.57741 13.0893C3.73369 13.2455 3.94565 13.3333 4.16667 13.3333H7.5C7.72101 13.3333 7.93297 13.2455 8.08926 13.0893C8.24554 12.933 8.33333 12.721 8.33333 12.5C8.33333 12.279 8.24554 12.067 8.08926 11.9107C7.93297 11.7545 7.72101 11.6667 7.5 11.6667ZM7.5 8.33333H4.16667C3.94565 8.33333 3.73369 8.42113 3.57741 8.57741C3.42113 8.73369 3.33333 8.94565 3.33333 9.16667C3.33333 9.38768 3.42113 9.59964 3.57741 9.75592C3.73369 9.9122 3.94565 10 4.16667 10H7.5C7.72101 10 7.93297 9.9122 8.08926 9.75592C8.24554 9.59964 8.33333 9.38768 8.33333 9.16667C8.33333 8.94565 8.24554 8.73369 8.08926 8.57741C7.93297 8.42113 7.72101 8.33333 7.5 8.33333ZM13.2667 6.15C13.3305 5.99824 13.3479 5.83098 13.3168 5.66932C13.2856 5.50766 13.2073 5.35885 13.0917 5.24167L8.09167 0.241667C8.02278 0.176847 7.94402 0.123401 7.85833 0.0833333C7.83346 0.0798001 7.80821 0.0798001 7.78333 0.0833333L7.55 0H2.5C1.83696 0 1.20107 0.263392 0.732233 0.732233C0.263392 1.20107 0 1.83696 0 2.5V14.1667C0 14.8297 0.263392 15.4656 0.732233 15.9344C1.20107 16.4033 1.83696 16.6667 2.5 16.6667H7.5C7.72101 16.6667 7.93297 16.5789 8.08926 16.4226C8.24554 16.2663 8.33333 16.0543 8.33333 15.8333C8.33333 15.6123 8.24554 15.4004 8.08926 15.2441C7.93297 15.0878 7.72101 15 7.5 15H2.5C2.27899 15 2.06702 14.9122 1.91074 14.7559C1.75446 14.5996 1.66667 14.3877 1.66667 14.1667V2.5C1.66667 2.27899 1.75446 2.06702 1.91074 1.91074C2.06702 1.75446 2.27899 1.66667 2.5 1.66667H6.66667V4.16667C6.66667 4.82971 6.93006 5.46559 7.3989 5.93443C7.86774 6.40327 8.50362 6.66667 9.16667 6.66667H12.5C12.6645 6.66585 12.8251 6.61634 12.9616 6.5244C13.098 6.43245 13.2041 6.30218 13.2667 6.15ZM9.16667 5C8.94565 5 8.73369 4.9122 8.57741 4.75592C8.42113 4.59964 8.33333 4.38768 8.33333 4.16667V2.84167L10.4917 5H9.16667ZM15 8.33333H10.8333C10.6123 8.33333 10.4004 8.42113 10.2441 8.57741C10.0878 8.73369 10 8.94565 10 9.16667V15.8333C10.0004 15.9841 10.0417 16.1319 10.1195 16.261C10.1972 16.3902 10.3086 16.4958 10.4417 16.5667C10.572 16.6336 10.7176 16.665 10.8639 16.6576C11.0102 16.6503 11.152 16.6046 11.275 16.525L12.9167 15.4417L14.5833 16.525C14.7078 16.597 14.8488 16.6356 14.9926 16.6369C15.1364 16.6383 15.2782 16.6024 15.404 16.5328C15.5298 16.4631 15.6355 16.3621 15.7107 16.2396C15.786 16.117 15.8282 15.9771 15.8333 15.8333V9.16667C15.8333 8.94565 15.7455 8.73369 15.5893 8.57741C15.433 8.42113 15.221 8.33333 15 8.33333ZM14.1667 14.2667L13.3833 13.7417C13.2455 13.6485 13.083 13.5987 12.9167 13.5987C12.7503 13.5987 12.5878 13.6485 12.45 13.7417L11.6667 14.2667V10H14.1667V14.2667Z" fill="#045CCE"/>
                  </svg>
                  Giải thích chi tiết
                </button>
              )}
            </div>
          </div>
        );
      });
    }

    // MULTIPLE_CHOICE
    if (questionType === 'multiple_choice') {
      return group.questions.map((question) => {
        const answerData = userAnswers[question.id] || {};
        const isCorrect = answerData.isCorrect;
        const userAnswer = answerData.userAnswer;
        const correctAnswer = answerData.correctAnswer || question.correctAnswer;

        return (
          <div key={question.id} className="reading-test__question-item reading-test__question-item--review">
            <div className="reading-test__question-row">
              <div className="reading-test__question-number">{question.number}.</div>
              <span className={`review-answer-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                {userAnswer || <em>(Chưa trả lời)</em>}
              </span>
              <div className="reading-test__question-text" dangerouslySetInnerHTML={{ __html: question.content || '' }} />
            </div>

            {/* Show correct answer if wrong */}
            {!isCorrect && expandedExplanations[question.id] && (
              <div className="review-correct-answer-section">
                <strong>Đáp án:</strong>
                <div className="review-correct-answer-text">{correctAnswer}</div>
              </div>
            )}

            {/* Explanation Section */}
            {expandedExplanations[question.id] && question.explanation && (
              <div className="review-explanation-section">
                <strong>Giải thích:</strong>
                <div 
                  className="review-explanation-text"
                  dangerouslySetInnerHTML={{ __html: question.explanation }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="review-actions">
              {question.locateText && (
                <button 
                  className="review-action-btn review-locate-btn"
                  onClick={() => handleLocate(question.locateText)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Locate
                </button>
              )}

              {question.explanation && (
                <button
                  className="review-action-btn review-explain-btn"
                  onClick={() => showExplanationModal(question)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                    <path d="M4.16667 6.66667H5C5.22101 6.66667 5.43297 6.57887 5.58926 6.42259C5.74554 6.26631 5.83333 6.05435 5.83333 5.83333C5.83333 5.61232 5.74554 5.40036 5.58926 5.24408C5.43297 5.0878 5.22101 5 5 5H4.16667C3.94565 5 3.73369 5.0878 3.57741 5.24408C3.42113 5.40036 3.33333 5.61232 3.33333 5.83333C3.33333 6.05435 3.42113 6.26631 3.57741 6.42259C3.73369 6.57887 3.94565 6.66667 4.16667 6.66667ZM7.5 11.6667H4.16667C3.94565 11.6667 3.73369 11.7545 3.57741 11.9107C3.42113 12.067 3.33333 12.279 3.33333 12.5C3.33333 12.721 3.42113 12.933 3.57741 13.0893C3.73369 13.2455 3.94565 13.3333 4.16667 13.3333H7.5C7.72101 13.3333 7.93297 13.2455 8.08926 13.0893C8.24554 12.933 8.33333 12.721 8.33333 12.5C8.33333 12.279 8.24554 12.067 8.08926 11.9107C7.93297 11.7545 7.72101 11.6667 7.5 11.6667ZM7.5 8.33333H4.16667C3.94565 8.33333 3.73369 8.42113 3.57741 8.57741C3.42113 8.73369 3.33333 8.94565 3.33333 9.16667C3.33333 9.38768 3.42113 9.59964 3.57741 9.75592C3.73369 9.9122 3.94565 10 4.16667 10H7.5C7.72101 10 7.93297 9.9122 8.08926 9.75592C8.24554 9.59964 8.33333 9.38768 8.33333 9.16667C8.33333 8.94565 8.24554 8.73369 8.08926 8.57741C7.93297 8.42113 7.72101 8.33333 7.5 8.33333ZM13.2667 6.15C13.3305 5.99824 13.3479 5.83098 13.3168 5.66932C13.2856 5.50766 13.2073 5.35885 13.0917 5.24167L8.09167 0.241667C8.02278 0.176847 7.94402 0.123401 7.85833 0.0833333C7.83346 0.0798001 7.80821 0.0798001 7.78333 0.0833333L7.55 0H2.5C1.83696 0 1.20107 0.263392 0.732233 0.732233C0.263392 1.20107 0 1.83696 0 2.5V14.1667C0 14.8297 0.263392 15.4656 0.732233 15.9344C1.20107 16.4033 1.83696 16.6667 2.5 16.6667H7.5C7.72101 16.6667 7.93297 16.5789 8.08926 16.4226C8.24554 16.2663 8.33333 16.0543 8.33333 15.8333C8.33333 15.6123 8.24554 15.4004 8.08926 15.2441C7.93297 15.0878 7.72101 15 7.5 15H2.5C2.27899 15 2.06702 14.9122 1.91074 14.7559C1.75446 14.5996 1.66667 14.3877 1.66667 14.1667V2.5C1.66667 2.27899 1.75446 2.06702 1.91074 1.91074C2.06702 1.75446 2.27899 1.66667 2.5 1.66667H6.66667V4.16667C6.66667 4.82971 6.93006 5.46559 7.3989 5.93443C7.86774 6.40327 8.50362 6.66667 9.16667 6.66667H12.5C12.6645 6.66585 12.8251 6.61634 12.9616 6.5244C13.098 6.43245 13.2041 6.30218 13.2667 6.15ZM9.16667 5C8.94565 5 8.73369 4.9122 8.57741 4.75592C8.42113 4.59964 8.33333 4.38768 8.33333 4.16667V2.84167L10.4917 5H9.16667ZM15 8.33333H10.8333C10.6123 8.33333 10.4004 8.42113 10.2441 8.57741C10.0878 8.73369 10 8.94565 10 9.16667V15.8333C10.0004 15.9841 10.0417 16.1319 10.1195 16.261C10.1972 16.3902 10.3086 16.4958 10.4417 16.5667C10.572 16.6336 10.7176 16.665 10.8639 16.6576C11.0102 16.6503 11.152 16.6046 11.275 16.525L12.9167 15.4417L14.5833 16.525C14.7078 16.597 14.8488 16.6356 14.9926 16.6369C15.1364 16.6383 15.2782 16.6024 15.404 16.5328C15.5298 16.4631 15.6355 16.3621 15.7107 16.2396C15.786 16.117 15.8282 15.9771 15.8333 15.8333V9.16667C15.8333 8.94565 15.7455 8.73369 15.5893 8.57741C15.433 8.42113 15.221 8.33333 15 8.33333ZM14.1667 14.2667L13.3833 13.7417C13.2455 13.6485 13.083 13.5987 12.9167 13.5987C12.7503 13.5987 12.5878 13.6485 12.45 13.7417L11.6667 14.2667V10H14.1667V14.2667Z" fill="#045CCE"/>
                  </svg>
                  Giải thích chi tiết
                </button>
              )}
            </div>
          </div>
        );
      });
    }

    // DEFAULT (YES/NO/NOT GIVEN, TRUE/FALSE/NOT GIVEN, etc.)
    return group.questions.map((question) => {
      const answerData = userAnswers[question.id] || {};
      const isCorrect = answerData.isCorrect;
      const userAnswer = answerData.userAnswer;
      const correctAnswer = answerData.correctAnswer || question.correctAnswer;

      return (
        <div key={question.id} className="reading-test__question-item reading-test__question-item--review">
          <div className="reading-test__question-row">
            <div className="reading-test__question-number">{question.number}.</div>
            <span className={`review-answer-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
              {userAnswer || <em>(Chưa trả lời)</em>}
            </span>
            <div className="reading-test__question-text" dangerouslySetInnerHTML={{ __html: question.content }} />
          </div>

          {/* Show correct answer if wrong */}
          {!isCorrect && expandedExplanations[question.id] && (
            <div className="review-correct-answer-section">
              <strong>Đáp án:</strong>
              <div className="review-correct-answer-text">{correctAnswer}</div>
            </div>
          )}

          {/* Explanation Section */}
          {expandedExplanations[question.id] && question.explanation && (
            <div className="review-explanation-section">
              <strong>Giải thích:</strong>
              <div 
                className="review-explanation-text"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="review-actions">
            {question.locateText && (
              <button 
                className="review-action-btn review-locate-btn"
                onClick={() => handleLocate(question.locateText)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Locate
              </button>
            )}

            {question.explanation && (
              <button
                className="review-action-btn review-explain-btn"
                onClick={() => showExplanationModal(question)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                  <path d="M4.16667 6.66667H5C5.22101 6.66667 5.43297 6.57887 5.58926 6.42259C5.74554 6.26631 5.83333 6.05435 5.83333 5.83333C5.83333 5.61232 5.74554 5.40036 5.58926 5.24408C5.43297 5.0878 5.22101 5 5 5H4.16667C3.94565 5 3.73369 5.0878 3.57741 5.24408C3.42113 5.40036 3.33333 5.61232 3.33333 5.83333C3.33333 6.05435 3.42113 6.26631 3.57741 6.42259C3.73369 6.57887 3.94565 6.66667 4.16667 6.66667ZM7.5 11.6667H4.16667C3.94565 11.6667 3.73369 11.7545 3.57741 11.9107C3.42113 12.067 3.33333 12.279 3.33333 12.5C3.33333 12.721 3.42113 12.933 3.57741 13.0893C3.73369 13.2455 3.94565 13.3333 4.16667 13.3333H7.5C7.72101 13.3333 7.93297 13.2455 8.08926 13.0893C8.24554 12.933 8.33333 12.721 8.33333 12.5C8.33333 12.279 8.24554 12.067 8.08926 11.9107C7.93297 11.7545 7.72101 11.6667 7.5 11.6667ZM7.5 8.33333H4.16667C3.94565 8.33333 3.73369 8.42113 3.57741 8.57741C3.42113 8.73369 3.33333 8.94565 3.33333 9.16667C3.33333 9.38768 3.42113 9.59964 3.57741 9.75592C3.73369 9.9122 3.94565 10 4.16667 10H7.5C7.72101 10 7.93297 9.9122 8.08926 9.75592C8.24554 9.59964 8.33333 9.38768 8.33333 9.16667C8.33333 8.94565 8.24554 8.73369 8.08926 8.57741C7.93297 8.42113 7.72101 8.33333 7.5 8.33333ZM13.2667 6.15C13.3305 5.99824 13.3479 5.83098 13.3168 5.66932C13.2856 5.50766 13.2073 5.35885 13.0917 5.24167L8.09167 0.241667C8.02278 0.176847 7.94402 0.123401 7.85833 0.0833333C7.83346 0.0798001 7.80821 0.0798001 7.78333 0.0833333L7.55 0H2.5C1.83696 0 1.20107 0.263392 0.732233 0.732233C0.263392 1.20107 0 1.83696 0 2.5V14.1667C0 14.8297 0.263392 15.4656 0.732233 15.9344C1.20107 16.4033 1.83696 16.6667 2.5 16.6667H7.5C7.72101 16.6667 7.93297 16.5789 8.08926 16.4226C8.24554 16.2663 8.33333 16.0543 8.33333 15.8333C8.33333 15.6123 8.24554 15.4004 8.08926 15.2441C7.93297 15.0878 7.72101 15 7.5 15H2.5C2.27899 15 2.06702 14.9122 1.91074 14.7559C1.75446 14.5996 1.66667 14.3877 1.66667 14.1667V2.5C1.66667 2.27899 1.75446 2.06702 1.91074 1.91074C2.06702 1.75446 2.27899 1.66667 2.5 1.66667H6.66667V4.16667C6.66667 4.82971 6.93006 5.46559 7.3989 5.93443C7.86774 6.40327 8.50362 6.66667 9.16667 6.66667H12.5C12.6645 6.66585 12.8251 6.61634 12.9616 6.5244C13.098 6.43245 13.2041 6.30218 13.2667 6.15ZM9.16667 5C8.94565 5 8.73369 4.9122 8.57741 4.75592C8.42113 4.59964 8.33333 4.38768 8.33333 4.16667V2.84167L10.4917 5H9.16667ZM15 8.33333H10.8333C10.6123 8.33333 10.4004 8.42113 10.2441 8.57741C10.0878 8.73369 10 8.94565 10 9.16667V15.8333C10.0004 15.9841 10.0417 16.1319 10.1195 16.261C10.1972 16.3902 10.3086 16.4958 10.4417 16.5667C10.572 16.6336 10.7176 16.665 10.8639 16.6576C11.0102 16.6503 11.152 16.6046 11.275 16.525L12.9167 15.4417L14.5833 16.525C14.7078 16.597 14.8488 16.6356 14.9926 16.6369C15.1364 16.6383 15.2782 16.6024 15.404 16.5328C15.5298 16.4631 15.6355 16.3621 15.7107 16.2396C15.786 16.117 15.8282 15.9771 15.8333 15.8333V9.16667C15.8333 8.94565 15.7455 8.73369 15.5893 8.57741C15.433 8.42113 15.221 8.33333 15 8.33333ZM14.1667 14.2667L13.3833 13.7417C13.2455 13.6485 13.083 13.5987 12.9167 13.5987C12.7503 13.5987 12.5878 13.6485 12.45 13.7417L11.6667 14.2667V10H14.1667V14.2667Z" fill="#045CCE"/>
                </svg>
                Giải thích chi tiết
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <TestLayout
        skillData={skillData}
        sectionData={sectionData}
        timeRemaining={timeRemaining}
        setTimeRemaining={() => {}}
        parts={parts}
        currentPartTab={currentPartTab}
        setCurrentPartTab={setCurrentPartTab}
        questionGroups={questionGroups}
        answers={{}} // Empty answers in review mode
        onSubmit={null} // No submit in review mode
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
            <PassageContent
              fontSize={fontSize}
              content={currentPassage.content}
            />
          </div>

          {/* Questions Panel */}
          <div className={`reading-test__questions reading-test__questions--${fontSize}`}>
            {currentPartGroups.map((group) => (
              <div key={group.id} id={`question-group-${group.id}`} className="reading-test__question-group">
                {/* Group Header */}
                <div className="reading-test__group-header">
                  <h3>Questions {group.startNumber} - {group.endNumber}</h3>
                  {group.instructions && (
                    <div 
                      className="reading-test__group-instructions"
                      dangerouslySetInnerHTML={{ __html: group.instructions }}
                    />
                  )}
                </div>

                {/* Group Content */}
                {group.groupContent && !containsInlinePlaceholders(group.groupContent) && (
                  <div
                    className="reading-test__group-content"
                    dangerouslySetInnerHTML={{ __html: group.groupContent }}
                  />
                )}

                {/* Questions in Review Mode */}
                <div className="reading-test__questions-list">
                  {renderReviewQuestions(group)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TestLayout>

      {/* Explanation Modal */}
      <ExplanationModal
        visible={explanationModalVisible}
        onClose={closeExplanationModal}
        question={selectedQuestion}
        userAnswer={selectedQuestion ? userAnswers[selectedQuestion.id]?.userAnswer : ''}
        correctAnswer={selectedQuestion ? userAnswers[selectedQuestion.id]?.correctAnswer || selectedQuestion.correctAnswer : ''}
        isCorrect={selectedQuestion ? userAnswers[selectedQuestion.id]?.isCorrect : false}
      />
    </>
  );
}
