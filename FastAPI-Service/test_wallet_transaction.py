"""
Test wallet transactions functionality
"""
import asyncio
from sqlalchemy import text, select
from app.database import AsyncSessionLocal
from app.models.payment_models import WalletTransaction


async def test_transactions():
    async with AsyncSessionLocal() as session:
        print("\n" + "="*60)
        print("📊 WALLET TRANSACTIONS TEST")
        print("="*60)
        
        # Check if table exists
        result = await session.execute(
            text("SHOW TABLES LIKE 'wallet_transactions'")
        )
        table_exists = result.fetchone()
        
        if table_exists:
            print("\n✅ Bảng wallet_transactions đã tồn tại")
            
            # Get all transactions
            result = await session.execute(
                select(WalletTransaction).order_by(WalletTransaction.created_at.desc())
            )
            transactions = result.scalars().all()
            
            print(f"\n📝 Tổng số giao dịch: {len(transactions)}")
            
            if transactions:
                print("\n🔍 Các giao dịch gần nhất:")
                for txn in transactions[:5]:
                    symbol = "+" if txn.amount > 0 else ""
                    print(f"\n  ID: {txn.id}")
                    print(f"  User: {txn.user_id}")
                    print(f"  Số tiền: {symbol}{txn.amount} 🥚")
                    print(f"  Loại: {txn.transaction_type}")
                    print(f"  Mô tả: {txn.description}")
                    print(f"  Số dư: {txn.balance_before} → {txn.balance_after}")
                    print(f"  Thời gian: {txn.created_at}")
            else:
                print("\n⚠️ Chưa có giao dịch nào")
        else:
            print("\n❌ Bảng wallet_transactions chưa tồn tại!")
        
        print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(test_transactions())
