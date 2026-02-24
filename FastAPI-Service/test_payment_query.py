"""
Test admin payments API endpoints
"""
import asyncio
import sys
from sqlalchemy import select
from app.database import async_session
from app.models.payment_models import Payment
from app.models.auth_models import User


async def test_payment_query():
    """Test the payment query with user relationship"""
    async with async_session() as db:
        try:
            print("=" * 60)
            print("Testing Payment Query with User Relationship")
            print("=" * 60)
            
            # Test 1: Count payments
            result = await db.execute(select(Payment))
            payments = result.scalars().all()
            print(f"\n✅ Total payments found: {len(payments)}")
            
            if len(payments) == 0:
                print("\n⚠️  No payments in database!")
                print("Run: python create_sample_payments.py")
                return
            
            # Test 2: Query with selectinload
            from sqlalchemy.orm import selectinload
            result = await db.execute(
                select(Payment)
                .options(selectinload(Payment.user))
                .limit(5)
            )
            payments_with_user = result.scalars().all()
            
            print(f"\n✅ Payments with user loaded: {len(payments_with_user)}")
            
            # Test 3: Check each payment's user
            print("\nPayment Details:")
            for i, payment in enumerate(payments_with_user, 1):
                user_info = "❌ No User" if not payment.user else f"✅ {payment.user.email}"
                print(f"  {i}. Order: {payment.order_code}")
                print(f"     User ID: {payment.user_id}")
                print(f"     User: {user_info}")
                print(f"     Amount: {payment.amount}đ")
                print(f"     Status: {payment.status.value}")
                print()
            
            # Test 4: Check if any payment has missing user
            missing_user_count = 0
            for payment in payments:
                user_result = await db.execute(
                    select(User).where(User.id == payment.user_id)
                )
                user = user_result.scalar_one_or_none()
                if not user:
                    missing_user_count += 1
                    print(f"⚠️  Payment {payment.order_code} has missing user (user_id: {payment.user_id})")
            
            if missing_user_count > 0:
                print(f"\n⚠️  Found {missing_user_count} payments with missing users!")
                print("This could cause 500 errors in the API.")
            else:
                print("\n✅ All payments have valid users!")
            
            print("\n" + "=" * 60)
            print("Test Complete!")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(test_payment_query())
