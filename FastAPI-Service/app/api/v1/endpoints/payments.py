from fastapi import APIRouter, HTTPException, Depends, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import random
from loguru import logger

from app.models.auth_models import User
from app.models.payment_models import Payment, UserWallet, PaymentStatus
from app.auth import get_current_user
from app.database import get_db
from app.services.payos_service import payos_service

router = APIRouter()


# ==================== Schemas ====================

class CreatePaymentRequest(BaseModel):
    amount: int  # Số tiền VNĐ
    
    
class PaymentResponse(BaseModel):
    id: int
    order_code: str
    amount: int
    owl_amount: int
    description: str
    status: str
    payment_url: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    balance: int
    total_deposited: int
    total_spent: int
    
    class Config:
        from_attributes = True


class PaymentHistoryItem(BaseModel):
    id: str
    time: str
    eggs: int
    note: str
    status: str
    

# ==================== Helper Functions ====================

def calculate_owl_amount(vnd_amount: int) -> int:
    """
    Calculate OWL amount from VND
    Example: 10,000 VND = 100 OWL (1 OWL = 100 VND)
    """
    return vnd_amount // 100


def generate_order_code() -> int:
    """Generate unique order code (timestamp + random)"""
    timestamp = int(datetime.utcnow().timestamp())
    random_part = random.randint(1000, 9999)
    return int(f"{timestamp}{random_part}")


async def get_or_create_wallet(db: AsyncSession, user_id: int) -> UserWallet:
    """Get or create user wallet"""
    result = await db.execute(
        select(UserWallet).where(UserWallet.user_id == user_id)
    )
    wallet = result.scalar_one_or_none()
    
    if not wallet:
        wallet = UserWallet(
            user_id=user_id,
            balance=0,
            total_deposited=0,
            total_spent=0
        )
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
    
    return wallet


# ==================== Endpoints ====================

@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_request: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new payment request
    """
    try:
        # Validate amount (minimum 10,000 VND)
        if payment_request.amount < 10000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số tiền tối thiểu là 10,000 VNĐ"
            )
        
        # Generate order code
        order_code = generate_order_code()
        
        # Calculate OWL amount
        owl_amount = calculate_owl_amount(payment_request.amount)
        
        # Create payment record
        payment = Payment(
            user_id=current_user.id,
            order_code=str(order_code),
            amount=payment_request.amount,
            owl_amount=owl_amount,
            description=f"Nạp {owl_amount} Trứng Cú",
            status=PaymentStatus.PENDING
        )
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        
        # Create PayOS payment link
        payos_result = await payos_service.create_payment_link(
            order_code=order_code,
            amount=payment_request.amount,
            description=f"Nap {owl_amount} OWL",  # Max 25 chars for non-linked accounts
            buyer_name=current_user.name or "User",
            buyer_email=current_user.email
        )
        
        if not payos_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể tạo link thanh toán. Vui lòng thử lại."
            )
        
        # Update payment with PayOS data
        payment.payos_data = payos_result
        await db.commit()
        await db.refresh(payment)
        
        # Log the response for debugging
        logger.info(f"PayOS Response - checkoutUrl: {payos_result.get('checkoutUrl')}")
        logger.info(f"PayOS Response - qrCode length: {len(payos_result.get('qrCode', ''))}")
        
        return PaymentResponse(
            id=payment.id,
            order_code=payment.order_code,
            amount=payment.amount,
            owl_amount=payment.owl_amount,
            description=payment.description,
            status=payment.status.value,
            payment_url=payos_result.get("checkoutUrl"),
            qr_code=payos_result.get("qrCode"),
            created_at=payment.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi tạo thanh toán"
        )


@router.get("/check/{order_code}")
async def check_payment_status(
    order_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check payment status and update if needed
    
    PayOS payment info response:
    {
        "code": "00",
        "desc": "success",
        "data": {
            "id": "124c33293c934a85be5b7f8761a27a07",
            "orderCode": 123,
            "amount": 10000,
            "amountPaid": 10000,
            "amountRemaining": 0,
            "status": "PAID",  // PENDING, PAID, CANCELLED
            "createdAt": "2024-01-15T10:30:00.000Z",
            "transactions": [...]
        }
    }
    """
    try:
        # Get payment from database
        result = await db.execute(
            select(Payment).where(
                Payment.order_code == order_code,
                Payment.user_id == current_user.id
            )
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy giao dịch"
            )
        
        # If already paid, return current status
        if payment.status == PaymentStatus.PAID:
            wallet = await get_or_create_wallet(db, current_user.id)
            return {
                "status": payment.status.value,
                "message": "Thanh toán đã hoàn tất",
                "owl_amount": payment.owl_amount,
                "balance": wallet.balance
            }
        
        # Query PayOS for payment status
        payos_info = await payos_service.get_payment_info(int(order_code))
        
        if payos_info:
            payos_status = payos_info.get("status")
            
            # Update payment status based on PayOS response
            if payos_status == "PAID":
                payment.status = PaymentStatus.PAID
                payment.paid_at = datetime.utcnow()
                
                # Get transaction info if available
                transactions = payos_info.get("transactions", [])
                if transactions and len(transactions) > 0:
                    first_tx = transactions[0]
                    payment.transaction_id = first_tx.get("reference")
                
                # Update user wallet
                wallet = await get_or_create_wallet(db, current_user.id)
                wallet.balance += payment.owl_amount
                wallet.total_deposited += payment.owl_amount
                
                await db.commit()
                
                return {
                    "status": PaymentStatus.PAID.value,
                    "message": f"Thanh toán thành công! Bạn đã nhận {payment.owl_amount} Trứng Cú",
                    "owl_amount": payment.owl_amount,
                    "new_balance": wallet.balance
                }
                
            elif payos_status == "CANCELLED":
                payment.status = PaymentStatus.CANCELLED
                payment.cancelled_at = datetime.utcnow()
                await db.commit()
                
                return {
                    "status": PaymentStatus.CANCELLED.value,
                    "message": "Giao dịch đã bị hủy"
                }
        
        return {
            "status": payment.status.value,
            "message": "Đang chờ thanh toán"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi kiểm tra thanh toán"
        )


@router.get("/history", response_model=List[PaymentHistoryItem])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user payment history
    """
    try:
        result = await db.execute(
            select(Payment)
            .where(Payment.user_id == current_user.id)
            .order_by(desc(Payment.created_at))
            .limit(100)
        )
        payments = result.scalars().all()
        
        history = []
        for p in payments:
            # Map status
            status_map = {
                PaymentStatus.PENDING: "pending",
                PaymentStatus.PAID: "done",
                PaymentStatus.CANCELLED: "failed",
                PaymentStatus.EXPIRED: "failed"
            }
            
            history.append(PaymentHistoryItem(
                id=p.order_code,
                time=p.created_at.strftime("%H:%M · %d/%m/%Y"),
                eggs=p.owl_amount,
                note=p.description or f"Nạp {p.owl_amount} Trứng Cú",
                status=status_map.get(p.status, "pending")
            ))
        
        return history
        
    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi lấy lịch sử thanh toán"
        )


@router.get("/wallet", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user wallet information
    """
    try:
        wallet = await get_or_create_wallet(db, current_user.id)
        
        return WalletResponse(
            balance=wallet.balance,
            total_deposited=wallet.total_deposited,
            total_spent=wallet.total_spent
        )
        
    except Exception as e:
        logger.error(f"Error getting wallet: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi lấy thông tin ví"
        )


@router.post("/webhook")
async def payos_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    PayOS webhook endpoint to receive payment notifications
    
    Webhook format from PayOS:
    {
        "code": "00",
        "desc": "success",
        "success": true,
        "data": {
            "orderCode": 123,
            "amount": 3000,
            "description": "VQRIO123",
            "accountNumber": "12345678",
            "reference": "TF230204212323",
            "transactionDateTime": "2023-02-04 18:25:00",
            "currency": "VND",
            "paymentLinkId": "124c33293c43417ab7879e14c8d9eb18",
            "code": "00",
            "desc": "Thành công",
            ...
        },
        "signature": "..."
    }
    """
    try:
        # Get webhook data
        webhook_data = await request.json()
        
        logger.info(f"Received PayOS webhook: {webhook_data}")
        
        # Verify webhook structure
        if not webhook_data.get("success"):
            logger.warning(f"PayOS webhook failed: {webhook_data.get('desc')}")
            return {"error": 0, "message": "Webhook received but marked as failed"}
        
        # Extract payment info from data field
        data = webhook_data.get("data", {})
        order_code = str(data.get("orderCode"))
        
        if not order_code:
            logger.error("No orderCode in webhook data")
            return {"error": 1, "message": "Missing orderCode"}
        
        # Find payment in database
        result = await db.execute(
            select(Payment).where(Payment.order_code == order_code)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            logger.warning(f"Payment not found for order code: {order_code}")
            return {"error": 0, "message": "Payment not found"}
        
        # Check if payment already processed
        if payment.status == PaymentStatus.PAID:
            logger.info(f"Payment {order_code} already marked as PAID")
            return {"error": 0, "message": "Payment already processed"}
        
        # Update payment based on webhook data
        # PayOS webhook is sent when payment is successful
        payment.status = PaymentStatus.PAID
        payment.paid_at = datetime.utcnow()
        payment.transaction_id = data.get("reference")  # Bank transaction reference
        payment.payment_method = "BANK_TRANSFER"
        payment.payos_data = data
        
        # Update wallet
        wallet = await get_or_create_wallet(db, payment.user_id)
        wallet.balance += payment.owl_amount
        wallet.total_deposited += payment.owl_amount
        
        await db.commit()
        
        logger.info(f"✅ Payment {order_code} marked as PAID. User {payment.user_id} received {payment.owl_amount} OWL")
        
        # PayOS expects a 2XX response to confirm webhook received
        return {"error": 0, "message": "success", "data": order_code}
        
    except Exception as e:
        logger.error(f"Error processing PayOS webhook: {str(e)}")
        # Still return success to avoid PayOS retrying
        return {"error": 0, "message": "Webhook received with error", "details": str(e)}


@router.get("/payment-packages")
async def get_payment_packages():
    """
    Get available payment packages
    """
    return [
        {"amount": 10000, "owl": 100, "label": "10,000đ", "bonus": 0},
        {"amount": 50000, "owl": 500, "label": "50,000đ", "bonus": 0},
        {"amount": 100000, "owl": 1000, "label": "100,000đ", "bonus": 100},
        {"amount": 200000, "owl": 2000, "label": "200,000đ", "bonus": 200},
        {"amount": 500000, "owl": 5000, "label": "500,000đ", "bonus": 500},
        {"amount": 1000000, "owl": 10000, "label": "1,000,000đ", "bonus": 1500},
    ]
