import React, { useState, useEffect } from 'react';
import { Modal, message, Spin } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/axios';
import './PaymentModal.css';

export default function PaymentModal({ visible, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchPackages();
    } else {
      // Reset when modal closes
      setSelectedAmount(null);
      setPaymentData(null);
    }
  }, [visible]);

  useEffect(() => {
    let interval;
    if (paymentData && !checkingPayment) {
      // Poll payment status every 3 seconds
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentData, checkingPayment]);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/payments/payment-packages');
      setPackages(res.data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      // Default packages if API fails
      setPackages([
        { amount: 10000, owl: 100, label: '10,000đ', bonus: 0 },
        { amount: 50000, owl: 500, label: '50,000đ', bonus: 0 },
        { amount: 100000, owl: 1000, label: '100,000đ', bonus: 100 },
        { amount: 200000, owl: 2000, label: '200,000đ', bonus: 200 },
        { amount: 500000, owl: 5000, label: '500,000đ', bonus: 500 },
        { amount: 1000000, owl: 10000, label: '1,000,000đ', bonus: 1500 },
      ]);
    }
  };

  const handleSelectPackage = async (pkg) => {
    setSelectedAmount(pkg.amount);
    setLoading(true);

    try {
      const res = await api.post('/payments/create', {
        amount: pkg.amount
      });

      setPaymentData(res.data);
      message.success('Đã tạo link thanh toán! Vui lòng quét mã QR để thanh toán.');
    } catch (err) {
      message.error(err?.response?.data?.detail || 'Không thể tạo thanh toán');
      setSelectedAmount(null);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData || checkingPayment) return;

    setCheckingPayment(true);
    try {
      const res = await api.get(`/payments/check/${paymentData.order_code}`);
      
      if (res.data.status === 'PAID') {
        message.success(res.data.message || 'Thanh toán thành công!');
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else if (res.data.status === 'CANCELLED') {
        message.error('Giao dịch đã bị hủy');
        setPaymentData(null);
        setSelectedAmount(null);
      }
    } catch (err) {
      console.error('Error checking payment:', err);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCancel = () => {
    setPaymentData(null);
    setSelectedAmount(null);
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Modal
      title={paymentData ? 'Quét mã QR để thanh toán' : 'Chọn gói nạp OWL'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={paymentData ? 500 : 700}
      className="payment-modal"
    >
      {loading ? (
        <div className="pm-loading">
          <Spin size="large" />
          <p>Đang tạo thanh toán...</p>
        </div>
      ) : paymentData ? (
        <div className="pm-qr-container">
          <div className="pm-qr-wrapper">
            {paymentData.qr_code ? (
              <QRCodeSVG 
                value={paymentData.qr_code} 
                size={280}
                level="H"
                includeMargin={true}
              />
            ) : paymentData.payment_url ? (
              <QRCodeSVG 
                value={paymentData.payment_url} 
                size={280}
                level="H"
                includeMargin={true}
              />
            ) : (
              <div style={{padding: '40px', textAlign: 'center', color: '#999'}}>
                Không có mã QR
              </div>
            )}
          </div>
          
          <div className="pm-payment-info">
            <h3>Thông tin thanh toán</h3>
            <div className="pm-info-row">
              <span>Mã giao dịch:</span>
              <strong>{paymentData.order_code}</strong>
            </div>
            <div className="pm-info-row">
              <span>Số tiền:</span>
              <strong>{formatCurrency(paymentData.amount)}</strong>
            </div>
            <div className="pm-info-row">
              <span>Số Trứng Cú nhận được:</span>
              <strong className="pm-owl-amount">{paymentData.owl_amount} 🥚</strong>
            </div>
          </div>

          <div className="pm-instructions">
            <p>📱 Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
            <p>⏱️ Thanh toán sẽ tự động được xác nhận sau khi chuyển khoản thành công</p>
            {paymentData.payment_url && (
              <p style={{marginTop: '12px'}}>
                <a 
                  href={paymentData.payment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{color: '#045CCE', fontWeight: 600, textDecoration: 'underline'}}
                >
                  🔗 Hoặc mở link thanh toán trên điện thoại
                </a>
              </p>
            )}
          </div>

          {checkingPayment && (
            <div className="pm-checking">
              <Spin size="small" /> Đang kiểm tra thanh toán...
            </div>
          )}
        </div>
      ) : (
        <div className="pm-packages">
          {packages.map((pkg) => (
            <div
              key={pkg.amount}
              className={`pm-package ${selectedAmount === pkg.amount ? 'selected' : ''}`}
              onClick={() => handleSelectPackage(pkg)}
            >
              <div className="pm-package-header">
                <span className="pm-package-amount">{pkg.label}</span>
                {pkg.bonus > 0 && <span className="pm-package-bonus">+{pkg.bonus} bonus</span>}
              </div>
              <div className="pm-package-owl">
                {pkg.owl + pkg.bonus} 🥚
              </div>
              <div className="pm-package-label">Trứng Cú</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
