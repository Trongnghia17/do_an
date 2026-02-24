"""
Script to fix migration conflicts by removing orphaned migration references
"""
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal


async def fix_migrations():
    async with AsyncSessionLocal() as session:
        # Remove orphaned migration references
        await session.execute(
            text("DELETE FROM alembic_version WHERE version_num IN ('h9i0j1k2l3m4', 'i1j2k3l4m5n6')")
        )
        await session.commit()
        print("✅ Đã xóa các migration references cũ!")
        
        # Show current migration version
        result = await session.execute(text("SELECT version_num FROM alembic_version"))
        current = result.scalar()
        print(f"📌 Migration hiện tại: {current}")


if __name__ == "__main__":
    asyncio.run(fix_migrations())
