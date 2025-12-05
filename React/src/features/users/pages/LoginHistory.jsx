import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import './LoginHistory.css';

export default function LoginHistory() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/user/login-history'); // optional backend endpoint
        if (!mounted) return;
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setError('Không thể tải dữ liệu từ API. Hiển thị dữ liệu mẫu.');
        setRows([
          {
            id: '1',
            device: 'Ipad Air',
            actionLabel: 'Đăng xuất',
            loginAt: '11:17 · 23/06/2025',
            lastActive: '11:17 · 23/06/2025',
            location: 'Ho Chi Minh, Ho Chi Minh City, Vietnam',
            status: 'active',
          },
          {
            id: '2',
            device: 'Ipad Pro 11',
            actionLabel: 'Xóa khỏi thiết bị',
            loginAt: '11:17 · 23/06/2025',
            lastActive: '11:17 · 23/06/2025',
            location: 'Ho Chi Minh, Ho Chi Minh City, Vietnam',
            status: 'signed_out',
          },
          {
            id: '3',
            device: 'DESKTOP 2',
            actionLabel: 'Xóa khỏi thiết bị',
            loginAt: '11:17 · 23/06/2025',
            lastActive: '11:17 · 23/06/2025',
            location: 'Ho Chi Minh, Ho Chi Minh City, Vietnam',
            status: 'signed_out',
          },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const badge = (s) => {
    if (s === 'active') return <span className="hl-badge hl-badge--active">ĐANG HOẠT ĐỘNG</span>;
    if (s === 'signed_out') return <span className="hl-badge hl-badge--signedout">ĐÃ ĐĂNG XUẤT</span>;
    return <span className="hl-badge">--</span>;
  };

  const handleAction = (row) => {
    // placeholder: call API to sign out or remove device
    console.log('action', row);
  };

  return (
    <div className="history-login">
      <h3 className="hl-title">LỊCH SỬ ĐĂNG NHẬP</h3>

      <div className="hl-card">
        {loading ? (
          <div className="hl-loading">Đang tải...</div>
        ) : (
          <>
            {error && <div className="hl-error">{error}</div>}

            <div className="hl-table-wrap">
              <table className="hl-table">
                <thead>
                  <tr>
                    <th>Tên thiết bị</th>
                    <th>Đăng nhập lúc</th>
                    <th>Lần hoạt động cuối</th>
                    <th>Vị trí</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr className="hl-empty"><td colSpan="5">Chưa có dữ liệu.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r.id}>
                      <td className="hl-device">
                        <div className="hl-device-name">{r.device}</div>
                        <button className="hl-device-action" onClick={() => handleAction(r)}>
                          {r.actionLabel}
                        </button>
                      </td>
                      <td>{r.loginAt}</td>
                      <td>{r.lastActive}</td>
                      <td className="hl-location">{r.location}</td>
                      <td className="hl-status">{badge(r.status)}</td>
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