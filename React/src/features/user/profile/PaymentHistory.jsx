import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import cong from '@/assets/images/cong.svg';
import './PaymentHistory.css';

export default function PaymentHistory() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/user/payments'); // backend endpoint (optional)
        if (!mounted) return;
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setError('Không thể tải dữ liệu từ API, dùng dữ liệu mẫu.');
        setRows([
          { id: '1236645', time: '11:17 · 23/06/2025', eggs: 150, note: 'Gói chấm bài Writing - Speaking 1 tháng', status: 'done' },
          { id: '3215946', time: '11:17 · 23/06/2025', eggs: 250, note: 'Gói chấm bài Writing - Speaking 3 tháng', status: 'pending' },
          { id: '6514978', time: '11:17 · 23/06/2025', eggs: 650, note: 'Đăng ký tài khoản thành công', status: 'failed' },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const statusLabel = (s) => {
    switch (s) {
      case 'done': return <span className="ph-badge ph-badge--done">ĐÃ CÓ TRỨNG</span>;
      case 'pending': return <span className="ph-badge ph-badge--pending">CHỜ XÁC NHẬN</span>;
      case 'failed': return <span className="ph-badge ph-badge--failed">THẤT BẠI</span>;
      default: return <span className="ph-badge">--</span>;
    }
  };

  return (
    <div className="payment-history">
      <div className="ph-header">
        <h3 className="ph-title">LỊCH SỬ THANH TOÁN</h3>
        <div className="ph-actions">
          <button className="ph-btn ph-btn--primary"><img src={cong} alt="" /> <p className='ph-btn-text'>Nạp OWL</p></button>
        </div>
      </div>

      <div className="ph-card">
        {loading ? (
          <div className="ph-loading">Đang tải...</div>
        ) : (
          <>
            {/* {error && <div className="ph-error">{error}</div>} */}

            <div className="ph-table-wrap">
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Thời gian</th>
                    <th>Số Trứng Cú</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr className="ph-empty"><td colSpan="5">Chưa có lịch sử thanh toán.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r.id}>
                      <td className="ph-td-id">{r.id}</td>
                      <td>{r.time}</td>
                      <td className="ph-td-eggs">{r.eggs}</td>
                      <td className="ph-td-note">{r.note}</td>
                      <td className="ph-td-status">{statusLabel(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}