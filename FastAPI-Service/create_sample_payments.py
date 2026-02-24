"""
Script to create sample payment data for testing
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import random

from app.database import async_session
from app.models.auth_models import User
from app.models.payment_models import Payment, UserWallet, PaymentStatus


async def create_sample_payments():
    """Create sample payment data"""
    async with async_session() as db:
        # Get all users
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("❌ No users found! Please create users first.")
            return
        
        print(f"✅ Found {len(users)} users")
        
        # Check existing payments
        existing = await db.execute(select(Payment))
        existing_count = len(existing.scalars().all())
        print(f"📊 Existing payments: {existing_count}")
        
        if existing_count > 0:
            print("⚠️  Payments already exist. Do you want to create more? (y/n)")
            # Skip for now in automated script
            return
        
        # Create sample payments for random users
        sample_amounts = [10000, 50000, 100000, 200000, 500000, 1000000]
        statuses = [PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.CANCELLED]
        
        payments_to_create = []
        
        for i, user in enumerate(users[:5]):  # First 5 users
            # Create 2-4 payments per user
            num_payments = random.randint(2, 4)
            
            for j in range(num_payments):
                amount = random.choice(sample_amounts)
                owl_amount = amount // 100  # 1 VND = 0.01 OWL
                status = random.choice(statuses)
                
                # Random date within last 30 days
                days_ago = random.randint(0, 30)
                created_at = datetime.utcnow() - timedelta(days=days_ago)
                
                payment = Payment(
                    user_id=user.id,
                    order_code=f"ORD{int(datetime.utcnow().timestamp())}{random.randint(1000, 9999)}",
                    amount=amount,
                    owl_amount=owl_amount,
                    description=f"Nạp {owl_amount} Trứng Cú",
                    status=status,
                    created_at=created_at,
                    updated_at=created_at
                )
                
                if status == PaymentStatus.PAID:
                    payment.paid_at = created_at + timedelta(minutes=random.randint(1, 5))
                    
                    # Update or create wallet
                    wallet_result = await db.execute(
                        select(UserWallet).where(UserWallet.user_id == user.id)
                    )
                    wallet = wallet_result.scalar_one_or_none()
                    
                    if not wallet:
                        wallet = UserWallet(
                            user_id=user.id,
                            balance=owl_amount,
                            total_deposited=owl_amount,
                            total_spent=0
                        )
                        db.add(wallet)
                    else:
                        wallet.balance += owl_amount
                        wallet.total_deposited += owl_amount
                
                payments_to_create.append(payment)
        
        # Add all payments
        db.add_all(payments_to_create)
        await db.commit()
        
        print(f"✅ Created {len(payments_to_create)} sample payments!")
        
        # Print summary
        for status in PaymentStatus:
            count = sum(1 for p in payments_to_create if p.status == status)
            print(f"   - {status.value}: {count}")


async def main():
    print("=" * 50)
    print("Creating Sample Payment Data")
    print("=" * 50)
    
    try:
        await create_sample_payments()
        print("\n✅ Done!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
