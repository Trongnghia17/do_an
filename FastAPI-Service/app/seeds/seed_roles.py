"""
Seed basic roles and permissions
Creates: admin and student roles
"""
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.auth_models import Role


async def seed_roles():
    """Seed basic roles: admin and student"""
    async with AsyncSessionLocal() as session:
        try:
            # Kiểm tra xem đã có roles chưa
            result = await session.execute(select(Role))
            existing_roles = result.scalars().all()
            
            if existing_roles:
                print("✅ Roles already exist, skipping seed...")
                return
            
            # Tạo roles
            admin_role = Role(
                name="admin",
                display_name="Administrator",
                description="Quản trị viên hệ thống - có toàn quyền quản lý",
                is_active=True
            )
            
            student_role = Role(
                name="student",
                display_name="Student",
                description="Học viên - có quyền làm bài thi và xem kết quả",
                is_active=True
            )
            
            session.add(admin_role)
            session.add(student_role)
            await session.commit()
            await session.refresh(admin_role)
            await session.refresh(student_role)
            
            print(f"✅ Created role: {admin_role.name} (ID: {admin_role.id})")
            print(f"✅ Created role: {student_role.name} (ID: {student_role.id})")
            
            # Only create roles (permissions system removed)
            print("🎯 Permissions system removed — creating roles only.")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error seeding roles: {e}")
            raise


async def create_admin_user():
    """Tạo tài khoản admin mặc định"""
    from app.models.auth_models import User
    
    async with AsyncSessionLocal() as session:
        try:
            # Kiểm tra xem đã có admin chưa
            result = await session.execute(
                select(User).where(User.email == "admin@owlenglish.com")
            )
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print("✅ Admin user already exists, skipping...")
                return
            
            # Lấy admin role
            result = await session.execute(
                select(Role).where(Role.name == "admin")
            )
            admin_role = result.scalar_one_or_none()
            
            if not admin_role:
                print("❌ Admin role not found. Run seed_roles first!")
                return
            
            # Tạo admin user
            admin_user = User(
                name="Administrator",
                email="admin@owlenglish.com",
                password=User.hash_password("admin123"),
                role_id=admin_role.id,
                is_active=True,
                email_verified_at=datetime.utcnow()
            )
            
            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)
            
            print(f"✅ Created admin user:")
            print(f"   Email: admin@owlenglish.com")
            print(f"   Password: admin123")
            print(f"   Role: {admin_role.display_name}")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error creating admin user: {e}")
            raise


async def main():
    """Run all seeds"""
    print("🌱 Starting database seeding...\n")
    await seed_roles()
    print()
    await create_admin_user()
    print("\n✅ All seeds completed!")


if __name__ == "__main__":
    asyncio.run(main())
