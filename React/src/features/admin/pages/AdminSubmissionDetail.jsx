/**
 * AdminSubmissionDetail – Xem chi tiết bài nộp của học sinh (Admin)
 * UI bắt mắt với CSS riêng
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fastapiService from '@/services/fastapi.service';
import './AdminSubmissionDetail.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const SKILL_LABEL = { listening: 'Listening', speaking: 'Speaking', reading: 'Reading', writing: 'Writing' };
const SKILL_COLOR = { listening: '#3B82F6', speaking: '#8B5CF6', reading: '#10B981', writing: '#F59E0B' };
const SKILL_BG    = { listening: '#EFF6FF', speaking: '#F5F3FF', reading: '#ECFDF5', writing: '#FFFBEB' };

const STATUS_CFG = {
  completed:   { label: 'Đã nộp',   bg: '#DBEAFE', color: '#1D4ED8' },
  graded:      { label: 'Đã chấm',  bg: '#DCFCE7', color: '#15803D' },
  in_progress: { label: 'Đang làm', bg: '#FEF9C3', color: '#A16207' },
};

function formatTime(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}g ${m}p ${s}s`;
  if (m > 0) return `${m} phút${s > 0 ? ` ${s} giây` : ''}`;
  return `${s} giây`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── SVG Circle Chart ──────────────────────────────────────────────────────────
function CircleChart({ value, total, color = '#10B981' }) {
  const pct = total > 0 ? value / total : 0;
  const circumference = 2 * Math.PI * 40;
  const dash = pct * circumference;
  return (
    <div className="asd-circle-wrap">
      <svg viewBox="0 0 100 100" className="asd-circle-svg">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="asd-circle-text">
        <span className="asd-circle-num">{value}</span>
        <span className="asd-circle-total">/{total}</span>
        <span className="asd-circle-label">câu đúng</span>
      </div>
    </div>
  );
}

// ── Answer Card ───────────────────────────────────────────────────────────────
function AnswerCard({ ans, hasAutoGrading }) {
  const [open, setOpen] = useState(false);

  let explanation = '';
  let locateText  = '';
  if (ans.metadata) {
    const m = ans.metadata;
    if (m.answers && Array.isArray(m.answers)) {
      const correct = m.answers.find(a => a.is_correct === '1' || a.is_correct === 1 || a.is_correct === true);
      if (correct?.feedback) explanation = correct.feedback;
    }
    explanation = explanation || m.explanation || m.feedback || '';
    locateText  = m.locate || m.hint || '';
  }

  const isUnanswered = !ans.user_answer && !ans.answer_audio;
  let statusCls   = 'skip';
  let statusLabel = 'Bỏ qua';
  let statusColor = '#D97706';
  let statusBg    = '#FEF3C7';

  if (hasAutoGrading && !isUnanswered) {
    if (ans.is_correct) {
      statusCls = 'correct'; statusLabel = 'Đúng';
      statusColor = '#15803D'; statusBg = '#DCFCE7';
    } else {
      statusCls = 'incorrect'; statusLabel = 'Sai';
      statusColor = '#DC2626'; statusBg = '#FEE2E2';
    }
  }

  return (
    <div className={`asd-answer-card ${hasAutoGrading ? statusCls : ''}`}>
      <div className="asd-answer-header">
        <div className="asd-answer-num">Câu {ans.question_number}</div>
        <span className="asd-answer-badge" style={{ color: statusColor, background: statusBg }}>
          {hasAutoGrading ? statusLabel : 'Đã làm'}
        </span>
      </div>

      {ans.question_content && (
        <div className="asd-question-content" dangerouslySetInnerHTML={{ __html: ans.question_content }} />
      )}

      {ans.answer_audio && (
        <div className="asd-audio-wrap">
          <span className="asd-audio-label">🎙 Ghi âm học sinh</span>
          <audio controls src={ans.answer_audio} />
        </div>
      )}

      <div className="asd-answer-row">
        <span className="asd-answer-row-label">Học sinh:</span>
        <span className={`asd-answer-val ${hasAutoGrading ? statusCls : ''}`}>
          {ans.user_answer || <em className="asd-no-answer">Chưa trả lời</em>}
        </span>
      </div>

      {hasAutoGrading && !ans.is_correct && ans.correct_answer && ans.correct_answer !== 'N/A' && (
        <div className="asd-answer-row">
          <span className="asd-answer-row-label">Đáp án đúng:</span>
          <span className="asd-answer-val correct">{ans.correct_answer}</span>
        </div>
      )}

      {ans.ai_feedback && (
        <div className="asd-ai-badge">
          <span>🤖 AI Band</span>
          <strong>{ans.ai_feedback.overall_band ?? '—'}</strong>
        </div>
      )}

      {(explanation || locateText) && (
        <button className="asd-explain-btn" onClick={() => setOpen(v => !v)}>
          {open ? '▲ Ẩn giải thích' : '▼ Xem giải thích'}
        </button>
      )}
      {open && (
        <div className="asd-explain-box">
          {locateText && (
            <div className="asd-explain-section">
              <span className="asd-explain-tag locate">📍 Locate</span>
              <p>{locateText}</p>
            </div>
          )}
          {explanation && (
            <div className="asd-explain-section">
              <span className="asd-explain-tag explain">💡 Giải thích</span>
              <div dangerouslySetInnerHTML={{ __html: explanation }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSubmissionDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await fastapiService.submission.adminGetSubmissionDetail(submissionId);
        if (res.data.success) setResult(res.data.data);
        else setError('Không tìm thấy dữ liệu');
      } catch (err) {
        setError(err?.response?.data?.detail || 'Không thể tải chi tiết bài nộp');
      } finally {
        setLoading(false);
      }
    })();
  }, [submissionId]);

  if (loading) return (
    <div className="asd-center">
      <div className="asd-spinner" />
      <span className="asd-center-text">Đang tải...</span>
    </div>
  );

  if (error || !result) return (
    <div className="asd-center">
      <div className="asd-error-icon">⚠️</div>
      <p className="asd-error-msg">{error || 'Không tìm thấy bài nộp'}</p>
      <button className="asd-btn-back" onClick={() => navigate(-1)}>← Quay lại</button>
    </div>
  );

  const skillType      = result.skill?.skill_type?.toLowerCase();
  const hasAutoGrading = skillType === 'reading' || skillType === 'listening';
  const correct        = result.correct_answers  || 0;
  const total          = result.total_questions  || 0;
  const answered       = result.answered_questions || 0;
  const incorrect      = answered - correct;
  const skipped        = total - answered;
  const accuracy       = total > 0 ? Math.round((correct / total) * 100) : 0;

  const skillCol  = SKILL_COLOR[skillType]  || '#6B7280';
  const skillBg   = SKILL_BG[skillType]     || '#F3F4F6';

  // ── Tính điểm AI từ answers (Speaking / Writing) ──
  let aiOverallBand = null;
  let aiCriteriaScores = null;
  let aiDetailedFeedback = null;
  if (!hasAutoGrading && result.answers?.length) {
    const aiAnswers = result.answers.filter(a => a.has_ai_grading && a.ai_feedback);
    if (aiAnswers.length > 0) {
      if (aiAnswers.length === 1) {
        aiOverallBand       = aiAnswers[0].ai_feedback.overall_band;
        aiCriteriaScores    = aiAnswers[0].ai_feedback.criteria_scores;
        aiDetailedFeedback  = aiAnswers[0].ai_feedback.detailed_feedback || aiAnswers[0].ai_feedback.band_justification;
      } else {
        // Nhiều câu → trung bình
        const sum = aiAnswers.reduce((acc, a) => acc + (parseFloat(a.ai_feedback.overall_band) || 0), 0);
        aiOverallBand = Math.round((sum / aiAnswers.length) * 2) / 2;
        // Gộp criteria scores
        const criteriaKeys = Object.keys(aiAnswers[0].ai_feedback.criteria_scores || {});
        if (criteriaKeys.length) {
          aiCriteriaScores = {};
          criteriaKeys.forEach(k => {
            const avg = aiAnswers.reduce((acc, a) => acc + (parseFloat(a.ai_feedback.criteria_scores?.[k]) || 0), 0) / aiAnswers.length;
            aiCriteriaScores[k] = Math.round(avg * 2) / 2;
          });
        }
      }
    }
  }

  const isGraded = result.teacher_score != null || aiOverallBand != null;
  const displayScore = result.teacher_score != null ? parseFloat(result.teacher_score) : aiOverallBand;
  const scoreSource  = result.teacher_score != null ? 'Giáo viên' : '🤖 AI';

  // STATUS: nếu AI đã chấm nhưng status vẫn là completed → hiển thị "Đã chấm AI"
  let statusCfg;
  if (result.status === 'graded' || result.teacher_score != null) {
    statusCfg = STATUS_CFG['graded'];
  } else if (aiOverallBand != null) {
    statusCfg = { label: 'Đã chấm AI', bg: '#EDE9FE', color: '#7C3AED' };
  } else {
    statusCfg = STATUS_CFG[result.status] || { label: result.status, bg: '#F3F4F6', color: '#374151' };
  }

  const answersByPart = {};
  (result.answers || []).forEach(a => {
    const p = a.part || 'Part 1';
    if (!answersByPart[p]) answersByPart[p] = [];
    answersByPart[p].push(a);
  });

  const filterList = (list) => {
    if (activeTab === 'correct')   return list.filter(a => a.is_correct);
    if (activeTab === 'incorrect') return list.filter(a => !a.is_correct);
    if (activeTab === 'skip')      return list.filter(a => !a.user_answer && !a.answer_audio);
    return list;
  };

  return (
    <div className="asd-root">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div className="asd-topbar">
        <button className="asd-topbar-back" onClick={() => navigate('/admin/exam-history')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Lịch sử làm bài
        </button>

        <div className="asd-topbar-center">
          Chi tiết bài nộp&nbsp;<span className="asd-topbar-id">#{result.id}</span>
        </div>

        <div className="asd-topbar-right">
          <span className="asd-badge" style={{ background: skillBg, color: skillCol }}>
            {SKILL_LABEL[skillType] || skillType}
          </span>
          <span className="asd-badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* ── Info Grid ──────────────────────────────────────────────────────── */}
      <div className="asd-info-grid">
        <div className="asd-info-card">
          <div className="asd-info-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>👤</div>
          <div className="asd-info-body">
            <div className="asd-info-label">Học sinh</div>
            <div className="asd-info-value">{result.user_name || '—'}</div>
            <div className="asd-info-sub">{result.user_email}</div>
          </div>
        </div>

        <div className="asd-info-card">
          <div className="asd-info-icon" style={{ background: skillBg, color: skillCol }}>📝</div>
          <div className="asd-info-body">
            <div className="asd-info-label">Đề thi</div>
            <div className="asd-info-value">{result.skill?.name || '—'}</div>
            <div className="asd-info-sub">{result.section_name || SKILL_LABEL[skillType] || '—'}</div>
          </div>
        </div>

        <div className="asd-info-card">
          <div className="asd-info-icon" style={{ background: '#FDF4FF', color: '#A855F7' }}>📅</div>
          <div className="asd-info-body">
            <div className="asd-info-label">Ngày nộp</div>
            <div className="asd-info-value">{formatDate(result.submitted_at)}</div>
            <div className="asd-info-sub">Bắt đầu: {formatDate(result.started_at)}</div>
          </div>
        </div>

        <div className="asd-info-card">
          <div className="asd-info-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>⏱</div>
          <div className="asd-info-body">
            <div className="asd-info-label">Thời gian làm</div>
            <div className="asd-info-value">{formatTime(result.time_spent)}</div>
          </div>
        </div>
      </div>

      {/* ── Score Card ─────────────────────────────────────────────────────── */}
      {hasAutoGrading ? (
        <div className="asd-score-card">
          <CircleChart value={correct} total={total} color={skillCol} />

          <div className="asd-score-divider" />

          <div className="asd-score-right">
            <div className="asd-score-title">Kết quả bài thi</div>
            <div className="asd-score-stats">
              <div className="asd-stat correct">
                <div className="asd-stat-dot" />
                <span>Câu đúng</span>
                <strong>{correct}</strong>
              </div>
              <div className="asd-stat incorrect">
                <div className="asd-stat-dot" />
                <span>Câu sai</span>
                <strong>{incorrect}</strong>
              </div>
              <div className="asd-stat skip">
                <div className="asd-stat-dot" />
                <span>Bỏ qua</span>
                <strong>{skipped}</strong>
              </div>
            </div>

            <div className="asd-accuracy-wrap">
              <div className="asd-accuracy-label">
                Độ chính xác
                <span style={{
                  color: accuracy >= 70 ? '#15803D' : accuracy >= 50 ? '#D97706' : '#DC2626',
                  fontWeight: 700, marginLeft: 8,
                }}>{accuracy}%</span>
              </div>
              <div className="asd-accuracy-bg">
                <div className="asd-accuracy-fill" style={{
                  width: `${accuracy}%`,
                  background: accuracy >= 70 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444',
                }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="asd-pending-card">
          <div className="asd-pending-emoji">{skillType === 'speaking' ? '🎙' : '✍️'}</div>
          <div className="asd-pending-info">
            <div className="asd-pending-title">
              Bài {skillType === 'speaking' ? 'Speaking' : 'Writing'}
              {isGraded
                ? ` – Đã chấm bởi ${scoreSource}`
                : ' – Chưa chấm điểm'}
            </div>
            <div className="asd-pending-sub">
              {answered}/{total} câu đã trả lời
            </div>
          </div>
          {isGraded && (
            <div className="asd-teacher-badge" style={{ background: skillBg, color: skillCol }}>
              {parseFloat(displayScore).toFixed(1)}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: 2 }}>/9.0</span>
            </div>
          )}
        </div>
      )}

      {/* ── AI Criteria Scores (Speaking/Writing) ──────────────────────────── */}
      {!hasAutoGrading && aiCriteriaScores && (
        <div className="asd-ai-criteria-card">
          <div className="asd-ai-criteria-title">📊 Điểm Tiêu Chí AI</div>
          <div className="asd-ai-criteria-list">
            {Object.entries(aiCriteriaScores).map(([k, v]) => {
              const NAMES = {
                fluency_coherence:  'Fluency & Coherence',
                lexical_resource:   'Lexical Resource',
                grammatical_range:  'Grammatical Range',
                pronunciation:      'Pronunciation',
                task_achievement:   'Task Achievement',
                coherence_cohesion: 'Coherence & Cohesion',
              };
              return (
                <div key={k} className="asd-ai-criteria-row">
                  <span className="asd-ai-criteria-name">{NAMES[k] || k}</span>
                  <div className="asd-ai-criteria-bar-wrap">
                    <div className="asd-ai-criteria-bar">
                      <div
                        className="asd-ai-criteria-fill"
                        style={{ width: `${(v / 9) * 100}%`, background: skillCol }}
                      />
                    </div>
                    <span className="asd-ai-criteria-score">{v}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {aiDetailedFeedback && (
            <div className="asd-ai-feedback-text">
              <strong>Nhận xét AI:</strong> {aiDetailedFeedback}
            </div>
          )}
        </div>
      )}

      {/* ── Review Section ─────────────────────────────────────────────────── */}
      <div className="asd-review-wrap">
        <div className="asd-review-header">
          <h3 className="asd-review-title">Chi tiết câu trả lời</h3>
          {hasAutoGrading && (
            <div className="asd-tabs">
              {[
                { key: 'all',       label: `Tất cả (${total})` },
                { key: 'correct',   label: `✓ Đúng (${correct})` },
                { key: 'incorrect', label: `✗ Sai (${incorrect})` },
                { key: 'skip',      label: `⊘ Bỏ qua (${skipped})` },
              ].map(t => (
                <button
                  key={t.key}
                  className={`asd-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {Object.keys(answersByPart).length === 0 ? (
          <div className="asd-empty">Không có câu trả lời nào được ghi nhận.</div>
        ) : (
          Object.entries(answersByPart).map(([part, answers]) => {
            const visible = filterList(answers);
            if (visible.length === 0) return null;
            return (
              <div key={part} className="asd-part">
                <div className="asd-part-title">{part}</div>
                <div className="asd-answer-list">
                  {visible.map(ans => (
                    <AnswerCard key={ans.question_id} ans={ans} hasAutoGrading={hasAutoGrading} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
