import React, { useState } from 'react';
import './WritingResultUI.css';

/**
 * Component hiển thị kết quả bài thi Writing
 * Thiết kế riêng với layout chuyên biệt cho Writing
 * Hỗ trợ hiển thị multi-task với tabs
 */

// Helper component để render AI grading cho 1 task
const TaskAIGradingSection = ({ taskResult, taskNumber }) => {
  const criterionNames = {
    'task_achievement': 'Task Achievement',
    'task_response': 'Task Response',
    'coherence_cohesion': 'Coherence & Cohesion',
    'lexical_resource': 'Lexical Resource',
    'grammatical_range': 'Grammatical Range & Accuracy',
    'grammatical_accuracy': 'Grammatical Range & Accuracy'
  };

  const fmt = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n.toFixed(1) : 'N/A';
  };

  return (
    <div className="task-ai-grading">
      {taskNumber && (
        <div className="task-header">
          <div className="task-header-content">
            <h4 className="task-title">Task {taskNumber}</h4>
            <div className="task-score">
              <span className="task-score-label">Band Score:</span>
              <span className="task-score-value">{fmt(taskResult.overall_band)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Scores */}
      {taskResult.criteria_scores && (
        <div className="criteria-section">
          <h4 className="criteria-section__title">📊 Điểm Các Tiêu Chí</h4>
          <div className="criteria-grid">
            {Object.entries(taskResult.criteria_scores).map(([criterion, score]) => (
              <div key={criterion} className="criterion-card">
                <div className="criterion-card__header">
                  <div className="criterion-card__name">
                    {criterionNames[criterion] || criterion}
                  </div>
                  <div className="criterion-card__score">{Number.isFinite(parseFloat(score)) ? parseFloat(score).toFixed(1) : score}</div>
                </div>
                
                {/* Score Bar */}
                <div className="criterion-card__bar">
                  <div 
                    className="criterion-card__bar-fill"
                    style={{ width: `${Number.isFinite(parseFloat(score)) ? (Math.max(0, Math.min(100, (parseFloat(score) / 9) * 100))) : 0}%` }}
                  />
                </div>

                {/* Feedback */}
                {taskResult.criteria_feedback && taskResult.criteria_feedback[criterion] && (
                  <div className="criterion-card__feedback">
                    {taskResult.criteria_feedback[criterion]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {taskResult.strengths && taskResult.strengths.length > 0 && (
        <div className="feedback-box feedback-box--strengths">
          <h4 className="feedback-box__title">
            <span className="feedback-box__icon">✅</span>
            Điểm Mạnh
          </h4>
          <ul className="feedback-box__list">
            {taskResult.strengths.map((strength, idx) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {taskResult.weaknesses && taskResult.weaknesses.length > 0 && (
        <div className="feedback-box feedback-box--weaknesses">
          <h4 className="feedback-box__title">
            <span className="feedback-box__icon">⚠️</span>
            Điểm Cần Cải Thiện
          </h4>
          <ul className="feedback-box__list">
            {taskResult.weaknesses.map((weakness, idx) => (
              <li key={idx}>{weakness}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {taskResult.suggestions && taskResult.suggestions.length > 0 && (
        <div className="feedback-box feedback-box--suggestions">
          <h4 className="feedback-box__title">
            <span className="feedback-box__icon">💡</span>
            Gợi Ý Cải Thiện
          </h4>
          <ol className="feedback-box__list feedback-box__list--numbered">
            {taskResult.suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Detailed Feedback */}
      {taskResult.detailed_feedback && (
        <div className="feedback-box feedback-box--detailed">
          <h4 className="feedback-box__title">
            <span className="feedback-box__icon">📝</span>
            Nhận Xét Chi Tiết
          </h4>
          <div className="feedback-box__content">
            <p>{taskResult.detailed_feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const WritingResultUI = ({ result, aiGradingResult, onAIGrading, aiLoading }) => {
  const [activeTab, setActiveTab] = useState(0);
  const totalQuestions = result?.total_questions || 0;
  const answeredQuestions = result?.answered_questions || 0;
  const skillType = result?.skill?.skill_type || 'writing';

  // Helpers to format band and convert to percentage for progress bars
  const formatBand = (b) => {
    const n = parseFloat(b);
    return Number.isFinite(n) ? n.toFixed(1) : 'N/A';
  };

  const bandToPercent = (b) => {
    const n = parseFloat(b);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, (n / 9) * 100));
  };

  return (
    <div className="writing-result">
      {/* Header Section */}
      <div className="writing-result__header">
        <div className="writing-result__title-section">
          <h1 className="writing-result__title">
            <span className="writing-result__icon">✍️</span>
            Kết Quả IELTS Writing
          </h1>
          <p className="writing-result__subtitle">
            Bài thi gồm {totalQuestions} Task • Bạn đã hoàn thành {answeredQuestions}/{totalQuestions} Task
          </p>
        </div>

        {/* Status Badge */}
        <div className="writing-result__status-badge">
          {result.teacher_score ? (
            <span className="badge badge--graded">Đã Chấm</span>
          ) : (
            <span className="badge badge--pending">Chờ Chấm Điểm</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="writing-result__main">
        {/* Left Column - Score & Info */}
        <div className="writing-result__sidebar">
          {/* Score Card */}
          {result.teacher_score ? (
            <div className="writing-result__score-card">
              <div className="score-card__label">Điểm Tổng Quan</div>
              <div className="score-card__value">{parseFloat(result.teacher_score).toFixed(1)}</div>
              <div className="score-card__max">/ 9.0 Band</div>
              
              {/* Progress Bar */}
              <div className="score-card__progress">
                <div 
                  className="score-card__progress-bar"
                  style={{ width: `${(result.teacher_score / 9) * 100}%` }}
                />
              </div>

              <div className="score-card__note">
                Chấm bởi giáo viên
              </div>
            </div>
          ) : aiGradingResult ? (
            <div className="writing-result__score-card writing-result__score-card--ai">
              <div className="score-card__label">
                <span className="ai-badge">🤖 AI</span>
                Điểm Dự Đoán
              </div>
              <div className="score-card__value">{formatBand(aiGradingResult.overall_band)}</div>
              <div className="score-card__max">/ 9.0 Band</div>
              
              <div className="score-card__progress">
                <div 
                  className="score-card__progress-bar score-card__progress-bar--ai"
                  style={{ width: `${bandToPercent(aiGradingResult.overall_band)}%` }}
                />
              </div>

              <div className="score-card__note">
                Chấm bằng AI - Tham khảo
              </div>
            </div>
          ) : (
            <div className="writing-result__score-card writing-result__score-card--pending">
              <div className="score-card__icon">⏳</div>
              <div className="score-card__pending-text">Đang chờ chấm điểm</div>
              
              {/* AI Grading Button */}
              <button 
                className="btn-ai-grading"
                onClick={onAIGrading}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <span className="spinner"></span>
                    Đang chấm...
                  </>
                ) : (
                  <>
                    <span className="ai-icon">🤖</span>
                    Chấm Điểm AI Ngay
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info Cards */}
          <div className="writing-result__info-cards">
            <div className="info-card">
              <div className="info-card__icon">📝</div>
              <div className="info-card__content">
                <div className="info-card__label">Số Task</div>
                <div className="info-card__value">{totalQuestions}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card__icon">✅</div>
              <div className="info-card__content">
                <div className="info-card__label">Đã Hoàn Thành</div>
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
        <div className="writing-result__content">
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
                  Đánh giá dựa trên IELTS Band Descriptors
                </p>
              </div>

              {/* Multi-Task Display */}
              {aiGradingResult.isMultiTask ? (
                <>
                  {/* Overall Score for Multi-Task */}
                  <div className="multi-task-overview">
                    <div className="multi-task-overview__score">
                      <span className="label">Writing Overall Band</span>
                      <span className="value">{formatBand(aiGradingResult.overall_band)}</span>
                      <span className="max">/ 9.0</span>
                    </div>
                    <p className="multi-task-overview__note">
                      {aiGradingResult.tasks.length === 2 
                        ? 'Task 1 (1/3) + Task 2 (2/3)'
                        : `Điểm tổng kết từ ${aiGradingResult.tasks.length} tasks`
                      }
                    </p>
                    <p className="multi-task-overview__instruction">
                      👇 Click vào mỗi tab bên dưới để xem chi tiết điểm và nhận xét riêng của từng Task
                    </p>
                  </div>

                  {/* Task Tabs */}
                  <div className="task-tabs">
                    <div className="task-tabs__header">
                      {aiGradingResult.tasks.map((task, idx) => {
                        // IELTS Writing weight: Task 1 = 1/3, Task 2 = 2/3
                        const weight = aiGradingResult.tasks.length === 2 
                          ? (idx === 0 ? '33%' : '67%')
                          : `${Math.round(100 / aiGradingResult.tasks.length)}%`;
                        
                        return (
                          <button
                            key={idx}
                            className={`task-tab ${activeTab === idx ? 'task-tab--active' : ''}`}
                            onClick={() => setActiveTab(idx)}
                          >
                            <span className="task-tab__label">
                              Task {task.taskNumber}
                              <span className="task-tab__weight">({weight})</span>
                            </span>
                            <span className="task-tab__score">Band {formatBand(task.result.overall_band)}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="task-tabs__content">
                      {aiGradingResult.tasks[activeTab] && (
                        <TaskAIGradingSection 
                          taskResult={aiGradingResult.tasks[activeTab].result}
                          taskNumber={aiGradingResult.tasks[activeTab].taskNumber}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Single Task Display */
                <TaskAIGradingSection 
                  taskResult={aiGradingResult}
                  taskNumber={null}
                />
              )}
            </div>
          )}

          {/* Empty State */}
          {!result.teacher_score && !aiGradingResult && (
            <div className="writing-result__empty-state">
              <div className="empty-state__icon">📋</div>
              <h3 className="empty-state__title">Đang Chờ Chấm Điểm</h3>
              <p className="empty-state__text">
                Bài viết của bạn đang được giáo viên xem xét. 
                Bạn có thể sử dụng chức năng AI để nhận kết quả sơ bộ ngay lập tức.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingResultUI;
