import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TestLayout from '../components/TestLayout';
import { getSkillById, getSectionById } from '../api/exams.api';
import './WritingTest.css';

const WritingTest = () => {
  const { skillId, sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes default
  const [currentPartTab, setCurrentPartTab] = useState(1);
  const [loading, setLoading] = useState(true);
  const [skillData, setSkillData] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [questionGroups, setQuestionGroups] = useState([]);
  const [parts, setParts] = useState([]);
  const [fontSize, setFontSize] = useState('normal');

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        let response;
        let data;
        
        if (sectionId) {
          response = await getSectionById(sectionId, { with_questions: true });
          data = response.data?.data || response.data;
          setSectionData(data);
        } else {
          response = await getSkillById(skillId, { with_sections: true });
          data = response.data?.data || response.data;
          setSkillData(data);
        }

        console.log('Writing Test - Fetched data:', data);
        
        // Xử lý sections - Writing có sections nhưng không có question_groups
        let allGroups = [];
        
        // Nếu fetch single section (sectionId provided)
        if (sectionId && data?.id) {
          // Data is a single section object
          allGroups.push({
            id: data.id,
            part: 1,
            content: data.content,
            instructions: '', // Không set instructions để content hiển thị
            questions: data.questions || [], // Writing có questions riêng lẻ
            title: data.title || `Task 1`
          });
          setQuestionGroups(allGroups);
          setParts([{ part: 1, name: 'Task 1' }]);
          setCurrentPartTab(1);
        } 
        // Nếu fetch skill với sections (skillId provided)
        else if (data?.sections && data.sections.length > 0) {
          // Với Writing, mỗi section là một task
          data.sections.forEach((section, index) => {
            // Lấy questions từ question_groups
            let sectionQuestions = [];
            if (section.question_groups && section.question_groups.length > 0) {
              // Lấy tất cả questions từ tất cả question_groups trong section
              section.question_groups.forEach(qg => {
                if (qg.questions && qg.questions.length > 0) {
                  sectionQuestions = [...sectionQuestions, ...qg.questions];
                }
              });
            }
            
            allGroups.push({
              id: section.id,
              part: index + 1,
              content: section.question_groups?.[0]?.content || section.content || '', // Lấy instruction từ question_group
              instructions: '', // Không set instructions để content hiển thị
              questions: sectionQuestions,
              title: section.title || `Task ${index + 1}`
            });
          });
          setQuestionGroups(allGroups);
          
          // Set parts
          const uniqueParts = allGroups.map((group, index) => ({
            part: index + 1,
            name: `Task ${index + 1}`
          }));
          setParts(uniqueParts);
          setCurrentPartTab(1);
        } else if (data?.questionGroups) {
          allGroups = data.questionGroups;
          setQuestionGroups(data.questionGroups);
          
          // Extract unique parts
          if (allGroups.length > 0) {
            const uniqueParts = [...new Set(allGroups.map(g => g.part))]
              .sort((a, b) => a - b)
              .map(partNum => ({
                part: partNum,
                name: `Task ${partNum}`
              }));
            setParts(uniqueParts);
            setCurrentPartTab(uniqueParts[0]?.part || 1);
          }
        }
        
        if (allGroups.length === 0) {
          console.error('No sections or questionGroups found in data:', data);
        }

        if (data?.duration) {
          setTimeRemaining(data.duration * 60);
        }
      } catch (error) {
        console.error('Error fetching exam data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [skillId, sectionId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Submitting answers:', answers);
    // TODO: Submit to API
    navigate('/exams/result');
  };

  const currentPartGroups = questionGroups.filter(g => g.part === currentPartTab);

  if (loading) {
    return <div className="writing-test__loading">Loading...</div>;
  }

  if (!skillData && !sectionData) {
    return (
      <div className="writing-test__loading">
        <p>Không tìm thấy dữ liệu bài thi</p>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  return (
    <TestLayout
      examData={skillData || sectionData}
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
      <div className={`writing-test__content ${fontSize !== 'normal' ? `writing-test__content--${fontSize}` : ''}`}>
        {currentPartGroups.map((group, groupIndex) => (
          <div key={group.id} className="writing-test__task">
            {/* Left Column - Instructions & Content */}
            <div className="writing-test__task-left">
              {/* Task Header */}
              <div className="writing-test__task-header">
                <h2 className="writing-test__task-title">
                  Writing Task {group.part}
                </h2>
                
              </div>

              {/* Task Instructions & Content */}
              {group.instructions && (
                <div 
                  className="writing-test__task-instructions"
                  dangerouslySetInnerHTML={{ __html: group.instructions }}
                />
              )}

              {/* Section Content - Hướng dẫn thời gian */}
              {group.content && (
                <div 
                  className="writing-test__task-content"
                  dangerouslySetInnerHTML={{ __html: group.content }}
                />
              )}

              {/* Question Content - ĐÂY LÀ ĐỀ BÀI CHÍNH */}
              {group.questions && group.questions.length > 0 && (
                <div className="writing-test__questions">
                  {group.questions.map((question, qIndex) => (
                    <div key={question.id} className="writing-test__question">
                      {/* Hiển thị bảng dữ liệu nếu có (Task 1) */}
                      {question.metadata?.chart_data && (
                        <div className="writing-test__chart-data">
                          <pre className="writing-test__data-table">
                            {question.metadata.chart_data}
                          </pre>
                        </div>
                      )}
                      
                      {/* Nội dung câu hỏi */}
                      {question.content && (
                        <div 
                          className="writing-test__question-content"
                          dangerouslySetInnerHTML={{ __html: question.content }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Answer Area */}
            <div className="writing-test__answer-section">
              <div className="writing-test__answer-header">
                <span className="writing-test__answer-label">
                  {group.part}. Your article
                </span>
              </div>
              
              <textarea
                className="writing-test__textarea"
                placeholder="Start typing your answer here..."
                value={answers[group.id] || ''}
                onChange={(e) => handleAnswerChange(group.id, e.target.value)}
              />
              
              <div className="writing-test__word-count-footer">
                {(() => {
                  const wordCount = (answers[group.id] || '').trim().split(/\s+/).filter(Boolean).length;
                  const targetWords = group.part === 1 ? 150 : 250;
                  return (
                    <>
                      <span>{wordCount} từ: </span>
                      <span className={wordCount < targetWords ? 'text-red' : 'text-green'}>
                        {wordCount}
                      </span>
                      <span>/{targetWords}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </TestLayout>
  );
};

export default WritingTest;
