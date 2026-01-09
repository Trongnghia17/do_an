import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestResult } from '../api/exams.api';
import logo from '@/assets/images/logo.png';
import mascotImage from '@/assets/images/cuchucmung.png';
import './TestResult.css';

export default function TestResult() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'correct', 'incorrect'

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await getTestResult(resultId);
        if (response.data.success) {
          setResult(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching test result:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="test-result__loading">
        <div>Đang tải kết quả...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="test-result__error">
        <div>Không tìm thấy kết quả bài thi</div>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  const correctAnswers = result.correct_answers || 0;
  const totalQuestions = result.total_questions || 0;
  const incorrectAnswers = result.answered_questions - correctAnswers; // Sửa: chỉ tính câu trả lời sai, không tính câu bỏ qua
  const unansweredCount = totalQuestions - result.answered_questions;

  // Kiểm tra loại skill (reading/listening có đáp án, speaking/writing chờ chấm)
  const skillType = result.skill?.skill_type?.toLowerCase();
  const hasAutoGrading = skillType === 'reading' || skillType === 'listening';

  // Group answers by part and section
  const answersByPart = {};
  if (result.answers && Array.isArray(result.answers)) {
    result.answers.forEach((answer) => {
      const part = answer.part || 'Part 1';
      
      if (!answersByPart[part]) {
        answersByPart[part] = [];
      }
      answersByPart[part].push(answer);
    });
  }

  const filteredAnswers = (answers) => {
    if (activeTab === 'correct') {
      return answers.filter(a => a.is_correct);
    }
    if (activeTab === 'incorrect') {
      return answers.filter(a => !a.is_correct);
    }
    return answers;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="test-result">
      {/* Header giống TestLayout */}
      <div className="test-result__header">
        <button className="test-result__close" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="test-result__header-info">
          <img src={logo} alt="OWL IELTS" className="test-result__logo" />
          <div className="test-result__header-text">
            <div className="test-result__header-label">Làm bài passage 1</div>
            <div className="test-result__header-name">
              {result.exam?.name || result.skill?.name || 'IELTS - Reading Test 1'}
            </div>
          </div>
        </div>
      </div>

      <div className="test-result__content">
        {/* Score Section */}
        <div className="test-result__score-section">
          <div className="test-result__mascot-card">
             <div className="test-result__mascot-text">
              Hôi kho bạn nhỉ? Mời bạn ôn luyện tập với OWL nhé !
            </div>
            <div className="test-result__mascot">
              <img src={mascotImage} alt="Congratulations" />
            </div>
           
          </div>
          
          <div className="test-result__score-card">
            <div className="test-result__score-header">
              <h2>Kết quả làm bài</h2>
              <div className="test-result__time">
                Thời gian làm bài 
                <div className="test-result__time-value">  {formatTime(result.time_spent)}</div>
              </div>
            </div>

            <div className="test-result__score-chart">
              <div className="test-result__score-circle">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  {hasAutoGrading && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={`${(correctAnswers / totalQuestions) * 251.2} 251.2`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  )}
                </svg>
                <div className="test-result__score-text">
                  {hasAutoGrading ? (
                    <>
                      <div className="test-result__score-number">{correctAnswers}/{totalQuestions}</div>
                      <div className="test-result__score-label">câu đúng</div>
                    </>
                  ) : result.teacher_score ? (
                    <>
                      <div className="test-result__score-number">{parseFloat(result.teacher_score).toFixed(1)}</div>
                      <div className="test-result__score-label">Điểm IELTS</div>
                    </>
                  ) : (
                    <>
                      <div className="test-result__score-number">{result.answered_questions}/{totalQuestions}</div>
                      <div className="test-result__score-label">câu đã làm</div>
                    </>
                  )}
                </div>
              </div>

              <div className="test-result__score-stats">
                {hasAutoGrading ? (
                  <>
                    <div className="test-result__stat test-result__stat--correct">
                      <div className="test-result__stat-dot"></div>
                      <span>Đúng</span>
                      <strong>{correctAnswers}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--incorrect">
                      <div className="test-result__stat-dot"></div>
                      <span>Sai</span>
                      <strong>{incorrectAnswers}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--unanswered">
                      <div className="test-result__stat-dot"></div>
                      <span>Bỏ qua</span>
                      <strong>{unansweredCount}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="test-result__stat test-result__stat--correct">
                      <div className="test-result__stat-dot"></div>
                      <span>Đã làm</span>
                      <strong>{result.answered_questions}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--unanswered">
                      <div className="test-result__stat-dot"></div>
                      <span>Chưa làm</span>
                      <strong>{unansweredCount}</strong>
                    </div>
                    <div className="test-result__stat test-result__stat--pending">
                      <div className="test-result__stat-dot"></div>
                      <span>Trạng thái</span>
                      <strong>Chờ chấm</strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Teacher feedback and grading status */}
            {!hasAutoGrading && (
              <div className="test-result__teacher-section">
                {result.teacher_score ? (
                  <>
                    <div className="test-result__teacher-score">
                      <div className="test-result__teacher-label">Điểm giáo viên chấm</div>
                      <div className="test-result__teacher-value">{parseFloat(result.teacher_score).toFixed(1)}</div>
                    </div>
                    {result.teacher_feedback && (
                      <div className="test-result__teacher-feedback">
                        <div className="test-result__feedback-label">Nhận xét của giáo viên:</div>
                        <div className="test-result__feedback-content">{result.teacher_feedback}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="test-result__pending-notice">
                    <svg className="test-result__pending-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#F59E0B"/>
                    </svg>
                    <h3 className="test-result__pending-title">Đang đợi giáo viên chấm bài</h3>
                    <p className="test-result__pending-description">
                      Bài làm của bạn đã được gửi thành công. Giáo viên sẽ chấm và cung cấp nhận xét sớm nhất có thể.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button className="test-result__review-btn" onClick={() => {
              // Scroll to answers section
              document.querySelector('.test-result__answers-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}>
              Giải thích chi tiết
            </button>
          </div>
        </div>

        {/* Answers Section */}
        <div className="test-result__answers-section">
          {Object.entries(answersByPart).map(([partName, answers]) => (
            <div key={partName} className="test-result__part">
              <h3 className="test-result__part-title">{partName}</h3>
              <div className="test-result__answers-grid">
                {answers.map((answer) => {
                  // Sử dụng question_number từ backend (đã được đánh số theo part)
                  const questionNumber = answer.question_number;
                  const isUnanswered = !answer.user_answer || answer.user_answer.trim() === '';
                  
                  return (
                    <div 
                      key={answer.question_id} 
                      className={`test-result__answer-item ${answer.is_correct ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect'}`}
                    >
                      <div className="test-result__answer-number">{questionNumber}</div>
                      <div className="test-result__answer-content">
                        <div className="test-result__answer-label">
                          <span className={`test-result__user-answer ${answer.is_correct ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect'}`}>
                            {answer.user_answer || '-'}
                          </span>
                          {hasAutoGrading && !isUnanswered && (
                            <> | Đáp án: <span className="test-result__answer-value">{answer.correct_answer || 'N/A'}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
