import React, { useState, useEffect } from 'react';
import './SpeakingResultUI.css';

/**
 * Component hiển thị kết quả bài thi Speaking
 * Thiết kế riêng với layout chuyên biệt cho Speaking
 */
const SpeakingResultUI = ({ result, aiGradingResult, onAIGrading, aiLoading }) => {
  const [aiCost, setAiCost] = useState(null);
  const [loadingCost, setLoadingCost] = useState(false);
  
  const totalQuestions = result?.total_questions || 0;
  const answeredQuestions = result?.answered_questions || 0;

  // Fetch AI grading cost when component mounts
  useEffect(() => {
    const fetchAiCost = async () => {
      try {
        setLoadingCost(true);
        const url = `${import.meta.env.VITE_FASTAPI_URL}/api/v1/grading/ai-grading-cost/speaking`;
        console.log('Fetching AI cost from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('AI Cost data:', data);
        
        if (response.ok) {
          setAiCost(data);
        } else {
          console.error('API Error:', data);
        }
      } catch (error) {
        console.error('Error fetching AI cost:', error);
      } finally {
        setLoadingCost(false);
      }
    };
    
    if (!aiGradingResult) {
      fetchAiCost();
    }
  }, [aiGradingResult]);

  return (
    <div className="speaking-result">
      {/* Header Section */}
      <div className="speaking-result__header">
        <div className="speaking-result__title-section">
          <h1 className="speaking-result__title">
            <span className="speaking-result__icon">🎤</span>
            Kết Quả IELTS Speaking
          </h1>
          <p className="speaking-result__subtitle">
            Bài thi gồm {totalQuestions} câu hỏi • Bạn đã trả lời {answeredQuestions}/{totalQuestions} câu
          </p>
        </div>

        {/* Status Badge */}
        <div className="speaking-result__status-badge">
          {result.teacher_score ? (
            <span className="badge badge--graded">Đã Chấm</span>
          ) : (
            <span className="badge badge--pending">Chờ Chấm Điểm</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="speaking-result__main">
        {/* Left Column - Score & Info */}
        <div className="speaking-result__sidebar">
          {/* Score Card */}
          {result.teacher_score ? (
            <div className="speaking-result__score-card">
              <div className="score-card__label">Điểm Tổng Quan</div>
              <div className="score-card__value">{parseFloat(result.teacher_score).toFixed(1)}</div>
              <div className="score-card__max">/ 9.0 Band</div>
              
              {/* Progress Circle */}
              <div className="score-card__circle">
                <svg viewBox="0 0 100 100" className="score-circle">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={`${(result.teacher_score / 9) * 251.2} 251.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <div className="score-circle__percentage">
                  {Math.round((result.teacher_score / 9) * 100)}%
                </div>
              </div>

              <div className="score-card__note">
                Chấm bởi giáo viên
              </div>
            </div>
          ) : aiGradingResult ? (
            <div className="speaking-result__score-card speaking-result__score-card--ai">
              <div className="score-card__label">
                <span className="ai-badge">🤖 AI</span>
                Điểm Dự Đoán
              </div>
              <div className="score-card__value">{aiGradingResult.overall_band}</div>
              <div className="score-card__max">/ 9.0 Band</div>
              
              <div className="score-card__circle">
                <svg viewBox="0 0 100 100" className="score-circle">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeDasharray={`${(aiGradingResult.overall_band / 9) * 251.2} 251.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <div className="score-circle__percentage score-circle__percentage--ai">
                  {Math.round((aiGradingResult.overall_band / 9) * 100)}%
                </div>
              </div>

              <div className="score-card__note">
                Chấm bằng AI - Tham khảo
              </div>
            </div>
          ) : (
            <div className="speaking-result__score-card speaking-result__score-card--pending">
              <div className="score-card__icon">🎙️</div>
              <div className="score-card__pending-text">Đang chờ chấm điểm</div>
              
              {/* AI Cost Info */}
              {aiCost && !loadingCost && (
                <div style={{ 
                  background: aiCost.can_afford ? '#fef3c7' : '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  marginTop: '1rem',
                  border: aiCost.can_afford ? '1px solid #fcd34d' : '1px solid #fca5a5'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    💰 Chi phí: <strong>{aiCost.cost} 🥚</strong>
                  </div>
                  <div style={{ marginBottom: aiCost.can_afford ? 0 : '0.75rem' }}>
                    Số dư: <strong>{aiCost.current_balance} 🥚</strong>
                  </div>
                  {!aiCost.can_afford && (
                    <>
                      <div style={{ color: '#dc2626', marginBottom: '0.75rem', fontWeight: '600' }}>
                        ⚠️ Thiếu {aiCost.shortfall} 🥚
                      </div>
                      <button
                        onClick={() => window.location.href = '/lich-su-thanh-toan'}
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}
                      >
                        💳 Nạp Trứng Cú Ngay
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {/* AI Grading Button */}
              <button 
                className="btn-ai-grading"
                onClick={onAIGrading}
                disabled={aiLoading || loadingCost || (aiCost && !aiCost.can_afford)}
              >
                {aiLoading ? (
                  <>
                    <span className="spinner"></span>
                    Đang chấm...
                  </>
                ) : loadingCost ? (
                  <>
                    <span className="spinner"></span>
                    Đang tải...
                  </>
                ) : (aiCost && !aiCost.can_afford) ? (
                  <>
                    ⚠️ Không đủ Trứng Cú
                  </>
                ) : (
                  <>
                    <span className="ai-icon">🤖</span>
                    Chấm Điểm AI ({aiCost?.cost || '...'} 🥚)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info Cards */}
          <div className="speaking-result__info-cards">
            <div className="info-card">
              <div className="info-card__icon">💬</div>
              <div className="info-card__content">
                <div className="info-card__label">Số Câu Hỏi</div>
                <div className="info-card__value">{totalQuestions}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card__icon">✅</div>
              <div className="info-card__content">
                <div className="info-card__label">Đã Trả Lời</div>
                <div className="info-card__value">{answeredQuestions}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card__icon">⏱️</div>
              <div className="info-card__content">
                <div className="info-card__label">Thời Gian</div>
                <div className="info-card__value">{Math.floor((result.time_spent || 0) / 60)}p</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Results */}
        <div className="speaking-result__content">
          {/* Teacher Feedback */}
          {result.teacher_score && result.teacher_feedback && (
            <div className="feedback-section feedback-section--teacher">
              <div className="feedback-section__header">
                <h3 className="feedback-section__title">
                  <span className="feedback-icon">👨‍🏫</span>
                  Nhận Xét Của Giáo Viên
                </h3>
              </div>
              <div className="feedback-section__content">
                <p>{result.teacher_feedback}</p>
              </div>
            </div>
          )}

          {/* AI Grading Results */}
          {aiGradingResult && (
            <div className="ai-grading-results">
              <div className="ai-results__header">
                <h3 className="ai-results__title">
                  <span className="ai-badge-large">🤖</span>
                  Phân Tích Chi Tiết Từ AI
                </h3>
                <p className="ai-results__subtitle">
                  Đánh giá dựa trên IELTS Speaking Band Descriptors
                </p>
              </div>

              {/* Pronunciation Note */}
              {aiGradingResult.pronunciation_note && (
                <div className="pronunciation-note">
                  <div className="pronunciation-note__icon">🔊</div>
                  <div className="pronunciation-note__content">
                    <h4 className="pronunciation-note__title">Lưu Ý Về Pronunciation</h4>
                    <p className="pronunciation-note__text">{aiGradingResult.pronunciation_note}</p>
                  </div>
                </div>
              )}

              {/* Criteria Scores */}
              {aiGradingResult.criteria_scores && (
                <div className="criteria-section">
                  <h4 className="criteria-section__title">📊 Điểm Các Tiêu Chí</h4>
                  <div className="criteria-list">
                    {Object.entries(aiGradingResult.criteria_scores).map(([criterion, score]) => {
                      const criterionNames = {
                        'fluency_coherence': 'Fluency & Coherence',
                        'lexical_resource': 'Lexical Resource',
                        'grammatical_range': 'Grammatical Range & Accuracy',
                        'pronunciation': 'Pronunciation'
                      };
                      
                      const criterionIcons = {
                        'fluency_coherence': '💬',
                        'lexical_resource': '📚',
                        'grammatical_range': '✍️',
                        'pronunciation': '🔊'
                      };
                      
                      return (
                        <div key={criterion} className="criterion-item">
                          <div className="criterion-item__header">
                            <div className="criterion-item__left">
                              <span className="criterion-item__icon">
                                {criterionIcons[criterion] || '📋'}
                              </span>
                              <div className="criterion-item__info">
                                <div className="criterion-item__name">
                                  {criterionNames[criterion] || criterion}
                                </div>
                                {aiGradingResult.criteria_feedback && aiGradingResult.criteria_feedback[criterion] && (
                                  <div className="criterion-item__feedback">
                                    {aiGradingResult.criteria_feedback[criterion]}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="criterion-item__score">{score}</div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="criterion-item__bar">
                            <div 
                              className="criterion-item__bar-fill"
                              style={{ width: `${(score / 9) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {aiGradingResult.strengths && aiGradingResult.strengths.length > 0 && (
                <div className="feedback-box feedback-box--strengths">
                  <h4 className="feedback-box__title">
                    <span className="feedback-box__icon">✅</span>
                    Điểm Mạnh
                  </h4>
                  <ul className="feedback-box__list">
                    {aiGradingResult.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {aiGradingResult.weaknesses && aiGradingResult.weaknesses.length > 0 && (
                <div className="feedback-box feedback-box--weaknesses">
                  <h4 className="feedback-box__title">
                    <span className="feedback-box__icon">⚠️</span>
                    Điểm Cần Cải Thiện
                  </h4>
                  <ul className="feedback-box__list">
                    {aiGradingResult.weaknesses.map((weakness, idx) => (
                      <li key={idx}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {aiGradingResult.suggestions && aiGradingResult.suggestions.length > 0 && (
                <div className="feedback-box feedback-box--suggestions">
                  <h4 className="feedback-box__title">
                    <span className="feedback-box__icon">💡</span>
                    Gợi Ý Cải Thiện
                  </h4>
                  <ol className="feedback-box__list feedback-box__list--numbered">
                    {aiGradingResult.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Detailed Feedback */}
              {aiGradingResult.detailed_feedback && (
                <div className="feedback-box feedback-box--detailed">
                  <h4 className="feedback-box__title">
                    <span className="feedback-box__icon">📖</span>
                    Nhận Xét Tổng Quan
                  </h4>
                  <div className="feedback-box__content">
                    <p>{aiGradingResult.detailed_feedback}</p>
                  </div>
                </div>
              )}

              {/* Band Justification */}
              {aiGradingResult.band_justification && (
                <div className="feedback-box feedback-box--justification">
                  <h4 className="feedback-box__title">
                    <span className="feedback-box__icon">🎓</span>
                    Giải Thích Band Score
                  </h4>
                  <div className="feedback-box__content">
                    <p>{aiGradingResult.band_justification}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result.teacher_score && !aiGradingResult && (
            <div className="speaking-result__empty-state">
              <div className="empty-state__icon">🎙️</div>
              <h3 className="empty-state__title">Đang Chờ Chấm Điểm</h3>
              <p className="empty-state__text">
                Bài nói của bạn đang được giáo viên xem xét. 
                Bạn có thể sử dụng chức năng AI để nhận kết quả sơ bộ ngay lập tức.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingResultUI;
