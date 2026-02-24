"""
Script to check AI grading configuration
"""
import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal


async def check_ai_config():
    async with AsyncSessionLocal() as session:
        # Get all AI grading configs
        result = await session.execute(
            text("SELECT * FROM ai_grading_config")
        )
        configs = result.fetchall()
        
        print("\n" + "="*60)
        print("📊 CẤU HÌNH GIÁ CHẤM AI")
        print("="*60)
        
        for config in configs:
            skill = config[1]  # skill_type
            cost = config[2]   # cost_per_grading
            active = config[4]  # is_active
            
            icon = "✍️" if skill == "writing" else "🎙️"
            status = "✅" if active else "❌"
            
            print(f"\n{icon} {skill.upper()}")
            print(f"   Giá: {cost} 🥚 mỗi lần chấm")
            print(f"   Trạng thái: {status}")
        
        print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(check_ai_config())
