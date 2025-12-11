import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fastapiService from '@/services/fastapi.service';
import listening from '@/assets/images/writing.svg';
import listening_active from '@/assets/images/listening_active.svg';
import speaking from '@/assets/images/speaking.svg';
import speaking_active from '@/assets/images/listening_active.svg';
import reading from '@/assets/images/writing.svg';
import reading_active from '@/assets/images/listening_active.svg';
import writing from '@/assets/images/writing.svg';
import writing_active from '@/assets/images/listening_active.svg';
import './ExamHistory.css';

const TABS = [
  { key: 'Listening', label: 'Listening', icon: listening, activeIcon: listening_active },
  { key: 'Speaking',  label: 'Speaking',  icon: speaking,  activeIcon: speaking_active },
  { key: 'Reading',   label: 'Reading',   icon: reading,   activeIcon: reading_active },
  { key: 'Writing',   label: 'Writing',   icon: writing,   activeIcon: writing_active },
];

export default function ExamHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('listening');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Gọi API lấy submissions của user
        const res = await fastapiService.submission.getMySubmissions();
        if (!mounted) return;
        
        // Transform data từ API sang format hiển thị
        const transformedData = (res.data || []).map(sub => {
          // Tính số câu đúng/sai từ answers (nếu có)
          const totalQuestions = sub.max_score || 0;
          const correctAnswers = sub.total_score || 0;
          const wrongAnswers = totalQuestions - correctAnswers;
          
          // Format thời gian làm bài
          const formatDuration = (seconds) => {
            if (!seconds) return '00:00:00';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          };
          
          return {
            id: sub.id,
            skillType: sub.skill_type || 'unknown',
            title: sub.skill_name || `Submission ${sub.id}`,
            duration: formatDuration(sub.time_spent),
            date: sub.submitted_at || sub.created_at,
            correct: correctAnswers,
            wrong: wrongAnswers,
            skipped: 0,
            status: sub.status
          };
        });
        
        setSubmissions(transformedData);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading submissions:', err);
        setError('Không thể tải lịch sử làm bài. Vui lòng thử lại sau.');
        setSubmissions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const rows = submissions.filter((e) => e.skillType.toLowerCase() === activeTab.toLowerCase());

  const handleViewDetail = (submissionId) => {
    navigate(`/exams/result/${submissionId}`);
  };

  return (
    <div className="exam-history">
      <h3 className="eh-title">Lịch sử làm bài</h3>

      <div className="eh-card">
        <div className="eh-tabs" role="tablist">
          {TABS.map((t) => {
            const isActive = t.key.toLowerCase() === activeTab.toLowerCase();
            return (
              <button
                key={t.key}
                className={`eh-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key.toLowerCase())}
                role="tab"
                aria-selected={isActive}
              >
                <img
                  src={isActive ? (t.activeIcon || t.icon) : t.icon}
                  alt={t.label}
                  className={`eh-tab-icon ${isActive ? 'active' : ''}`}
                />
                <span className="eh-tab-label">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="eh-table-wrap">
          {loading ? (
            <div className="eh-loading">Đang tải...</div>
          ) : (
            <>
              {error && <div className="eh-error">{error}</div>}
              <table className="eh-table">
                <thead>
                  <tr>
                    <th>Đề thi</th>
                    <th>Thời gian làm bài</th>
                    <th>Ngày làm bài</th>
                    <th>Câu đúng</th>
                    <th>Câu sai</th>
                    <th>Câu bỏ qua</th>
                    <th>Tỉ lệ đúng</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr className="eh-empty">
                      <td colSpan="7">Chưa có lịch sử cho phần này.</td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const total = (r.correct || 0) + (r.wrong || 0) + (r.skipped || 0) || 1;
                      const acc = Math.round(((r.correct || 0) / total) * 100);
                      return (
                        <tr key={r.id}>
                          <td className="eh-title-cell">
                            <a 
                              className="eh-link" 
                              href="#!" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleViewDetail(r.id);
                              }}
                            >
                              {r.title}
                            </a>
                          </td>
                          <td>{r.duration}</td>
                          <td>{new Date(r.date).toLocaleDateString('vi-VN')}</td>
                          <td>{r.correct ?? 0}</td>
                          <td>{r.wrong ?? 0}</td>
                          <td>{r.skipped ?? 0}</td>
                          <td>
                            <span className={acc >= 70 ? 'text-success' : acc >= 50 ? 'text-warning' : 'text-danger'}>
                              {acc}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}