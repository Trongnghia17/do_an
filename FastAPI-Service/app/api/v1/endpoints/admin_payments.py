from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from loguru import logger

from app.models.auth_models import User
from app.models.payment_models import Payment, UserWallet, PaymentStatus
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()


# ==================== Schemas ====================

class PaymentHistoryResponse(BaseModel):
    id: int
    order_code: str
    user_id: int
    user_email: str
    user_name: Optional[str] = None
    amount: int
    owl_amount: int
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaymentStatisticsResponse(BaseModel):
    total_transactions: int
    total_amount: int
    total_owl_sold: int
    pending_count: int
    paid_count: int
    cancelled_count: int
    expired_count: int


class UserWalletInfo(BaseModel):
    user_id: int
    user_email: str
    user_name: Optional[str] = None
    balance: int
    total_deposited: int
    total_spent: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Helper Functions ====================

async def verify_admin(current_user: User):
    """Verify that current user is admin"""
    if not current_user.role_id or current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền truy cập"
        )
    return current_user


# ==================== Endpoints ====================

@router.get("/history", response_model=List[PaymentHistoryResponse])
async def get_all_payment_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING, PAID, CANCELLED, EXPIRED"),
    search: Optional[str] = Query(None, description="Search by email, order code, or name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all payment history (Admin only)
    Supports pagination, filtering by status, and search
    """
    try:
        logger.info(f"Admin {current_user.email} requesting payment history")
        await verify_admin(current_user)
        
        # First, check total count
        count_query = select(func.count(Payment.id))
        count_result = await db.execute(count_query)
        total_count = count_result.scalar() or 0
        logger.info(f"Total payments in database: {total_count}")
        
        # Build query with user information
        query = select(Payment).options(selectinload(Payment.user))
        
        # Apply status filter
        if status_filter:
            try:
                status_enum = PaymentStatus[status_filter.upper()]
                query = query.where(Payment.status == status_enum)
                logger.info(f"Filtering by status: {status_filter}")
            except KeyError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status_filter}. Valid values: PENDING, PAID, CANCELLED, EXPIRED"
                )
        
        # Apply search filter
        if search:
            # Use outerjoin instead of join to avoid issues
            query = query.outerjoin(Payment.user).where(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.name.ilike(f"%{search}%"),
                    Payment.order_code.ilike(f"%{search}%")
                )
            )
            logger.info(f"Searching for: {search}")
        
        # Order by created_at descending
        query = query.order_by(desc(Payment.created_at))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        payments = result.scalars().all()
        
        logger.info(f"Found {len(payments)} payments for current query")
        
        # Format response
        history = []
        for payment in payments:
            # Get user info safely
            user_email = payment.user.email if payment.user else "Unknown"
            user_name = payment.user.name if payment.user else None
            
            history.append(PaymentHistoryResponse(
                id=payment.id,
                order_code=payment.order_code,
                user_id=payment.user_id,
                user_email=user_email,
                user_name=user_name,
                amount=payment.amount,
                owl_amount=payment.owl_amount,
                description=payment.description,
                status=payment.status.value,
                created_at=payment.created_at,
                updated_at=payment.updated_at
            ))
        
        logger.info(f"Returning {len(history)} payment records")
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Có lỗi xảy ra: {str(e)}"
        )


@router.get("/statistics", response_model=PaymentStatisticsResponse)
async def get_payment_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment statistics (Admin only)
    """
    try:
        logger.info(f"Admin {current_user.email} requesting payment statistics")
        await verify_admin(current_user)
        
        # Total transactions
        total_result = await db.execute(select(func.count(Payment.id)))
        total_transactions = total_result.scalar() or 0
        logger.info(f"Total transactions: {total_transactions}")
        
        # Total amount and OWL (only PAID)
        paid_result = await db.execute(
            select(
                func.sum(Payment.amount),
                func.sum(Payment.owl_amount)
            ).where(Payment.status == PaymentStatus.PAID)
        )
        total_amount, total_owl_sold = paid_result.first()
        total_amount = total_amount or 0
        total_owl_sold = total_owl_sold or 0
        
        # Count by status
        pending_result = await db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.PENDING)
        )
        pending_count = pending_result.scalar() or 0
        
        paid_count_result = await db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.PAID)
        )
        paid_count = paid_count_result.scalar() or 0
        
        cancelled_result = await db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.CANCELLED)
        )
        cancelled_count = cancelled_result.scalar() or 0
        
        expired_result = await db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.EXPIRED)
        )
        expired_count = expired_result.scalar() or 0
        
        stats = PaymentStatisticsResponse(
            total_transactions=total_transactions,
            total_amount=total_amount,
            total_owl_sold=total_owl_sold,
            pending_count=pending_count,
            paid_count=paid_count,
            cancelled_count=cancelled_count,
            expired_count=expired_count
        )
        
        logger.info(f"Statistics: {stats}")
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment statistics: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Có lỗi xảy ra: {str(e)}"
        )


@router.get("/wallets", response_model=List[UserWalletInfo])
async def get_all_user_wallets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by email or name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all user wallets (Admin only)
    """
    await verify_admin(current_user)
    
    # Build query
    query = select(UserWallet).options(selectinload(UserWallet.user))
    
    # Apply search filter
    if search:
        query = query.join(UserWallet.user).where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%")
            )
        )
    
    # Order by balance descending
    query = query.order_by(desc(UserWallet.balance))
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    wallets = result.scalars().all()
    
    # Format response
    wallet_list = []
    for wallet in wallets:
        wallet_list.append(UserWalletInfo(
            user_id=wallet.user_id,
            user_email=wallet.user.email,
            user_name=wallet.user.name,
            balance=wallet.balance,
            total_deposited=wallet.total_deposited,
            total_spent=wallet.total_spent,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at
        ))
    
    return wallet_list
