from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.auth_models import User, Role
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()


class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    email: str
    phone: Optional[str]
    is_active: bool
    role_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 20,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users (Requires authentication)"""
    if limit > 100:
        limit = 100
    
    query = select(User).where(User.deleted_at.is_(None))
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/stats/summary")
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user statistics"""
    # Total users
    total_result = await db.execute(
        select(func.count(User.id)).where(User.deleted_at.is_(None))
    )
    total = total_result.scalar()
    
    # Active users
    active_result = await db.execute(
        select(func.count(User.id))
        .where(User.deleted_at.is_(None))
        .where(User.is_active == True)
    )
    active = active_result.scalar()
    
    return {
        "total": total,
        "active": active,
        "inactive": total - active
    }
