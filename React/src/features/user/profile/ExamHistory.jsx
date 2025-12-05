import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
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
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('Listening');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/user/exams'); // backend endpoint expected
        if (!mounted) return;
        setExams(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setError('Không thể load dữ liệu từ API, dùng dữ liệu thử nghiệm.');
        // mock data for testing
        setExams([
          {
            id: 1,
            section: 'Listening',
            title: 'Reading - Test 6 - Trainer 2',
            duration: '01:00:32',
            date: '2025-08-23',
            correct: 30,
            wrong: 5,
            skipped: 0,
          },
          {
            id: 2,
            section: 'Listening',
            title: 'Actual Test 1 - 2025 - Reading',
            duration: '01:00:32',
            date: '2025-08-20',
            correct: 25,
            wrong: 10,
            skipped: 0,
          },
          {
            id: 3,
            section: 'Reading',
            title: 'Actual Test 9 - 2025 - Reading',
            duration: '00:50:10',
            date: '2025-07-12',
            correct: 40,
            wrong: 2,
            skipped: 0,
          },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const rows = exams.filter((e) => e.section === activeTab);

  return (
    <div className="exam-history">
      <h3 className="eh-title">Lịch sử làm bài</h3>

      <div className="eh-card">
        <div className="eh-tabs" role="tablist">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <button
                key={t.key}
                className={`eh-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
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
                            <a className="eh-link" href="#!" onClick={(e) => e.preventDefault()}>
                              {r.title}
                            </a>
                          </td>
                          <td>{r.duration}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.correct ?? 0}</td>
                          <td>{r.wrong ?? 0}</td>
                          <td>{r.skipped ?? 0}</td>
                          <td>{acc}%</td>
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