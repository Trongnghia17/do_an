"""
Quick script to check payment data in database
"""
import asyncio
from sqlalchemy import select, func
from app.database import async_session
from app.models.payment_models import Payment, PaymentStatus
from app.models.auth_models import User


async def check_data():
    async with async_session() as db:
        # Count users
        user_count = await db.execute(select(func.count(User.id)))
        print(f"👥 Total Users: {user_count.scalar()}")
        
        # Count payments
        payment_count = await db.execute(select(func.count(Payment.id)))
        total = payment_count.scalar()
        print(f"💳 Total Payments: {total}")
        
        if total == 0:
            print("\n⚠️  No payment data found!")
            print("Run: python create_sample_payments.py")
            return
        
        # Count by status
        print("\nPayments by Status:")
        for status in PaymentStatus:
            count = await db.execute(
                select(func.count(Payment.id)).where(Payment.status == status)
            )
            print(f"  - {status.value}: {count.scalar()}")
        
        # Get recent payments
        print("\nRecent Payments:")
        result = await db.execute(
            select(Payment).order_by(Payment.created_at.desc()).limit(5)
        )
        payments = result.scalars().all()
        
        for p in payments:
            print(f"  - {p.order_code}: {p.amount}đ ({p.status.value}) - User ID: {p.user_id}")


if __name__ == "__main__":
    asyncio.run(check_data())
