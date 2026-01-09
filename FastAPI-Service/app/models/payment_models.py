from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class PaymentStatus(str, enum.Enum):
    """Payment status"""
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class UserWallet(Base):
    """User Wallets table - Ví OWL của người dùng"""
    __tablename__ = "user_wallets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    balance = Column(Integer, default=0, nullable=False)  # Số Trứng Cú hiện có
    total_deposited = Column(Integer, default=0, nullable=False)  # Tổng đã nạp
    total_spent = Column(Integer, default=0, nullable=False)  # Tổng đã chi tiêu
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="wallet")

    def __repr__(self):
        return f"<UserWallet {self.id}: User {self.user_id} - Balance {self.balance}>"


class PaymentPackage(Base):
    """Payment Packages table - Các gói nạp tiền"""
    __tablename__ = "payment_packages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    amount = Column(Integer, nullable=False)  # Số tiền VNĐ (vd: 10000, 50000)
    owl_amount = Column(Integer, nullable=False)  # Số Trứng Cú cơ bản
    bonus_owl = Column(Integer, default=0, nullable=False)  # Số Trứng Cú thưởng thêm
    label = Column(String(100), nullable=True)  # Nhãn hiển thị (vd: "10,000đ")
    description = Column(Text, nullable=True)  # Mô tả gói
    is_active = Column(Boolean, default=True, nullable=False)  # Hiển thị hay không
    display_order = Column(Integer, default=0, nullable=False)  # Thứ tự hiển thị
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PaymentPackage {self.id}: {self.amount}đ = {self.owl_amount + self.bonus_owl} OWL>"


class Payment(Base):
    """Payments table - Lịch sử thanh toán"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_code = Column(String(100), unique=True, nullable=False, index=True)  # Mã giao dịch PayOS
    amount = Column(Integer, nullable=False)  # Số tiền thanh toán (VNĐ)
    owl_amount = Column(Integer, nullable=False)  # Số Trứng Cú nhận được
    description = Column(String(500), nullable=True)  # Nội dung thanh toán
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)  # Phương thức thanh toán
    transaction_id = Column(String(100), nullable=True)  # Mã giao dịch từ ngân hàng
    payos_data = Column(JSON, nullable=True)  # Dữ liệu phản hồi từ PayOS
    paid_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    expired_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="payments")

    def __repr__(self):
        return f"<Payment {self.id}: {self.order_code} - {self.status}>"
