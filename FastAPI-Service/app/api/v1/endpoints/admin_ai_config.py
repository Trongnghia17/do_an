from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.models.auth_models import User
from app.models.payment_models import AIGradingConfig
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()


# ==================== Helper Functions ====================

async def verify_admin(current_user: User):
    """Verify user is admin"""
    if current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền thực hiện thao tác này"
        )


# ==================== Schemas ====================

class AIGradingConfigBase(BaseModel):
    skill_type: str  # 'writing' or 'speaking'
    cost_per_grading: int
    description: Optional[str] = None
    is_active: bool = True


class AIGradingConfigCreate(AIGradingConfigBase):
    pass


class AIGradingConfigUpdate(BaseModel):
    cost_per_grading: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class AIGradingConfigResponse(AIGradingConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Endpoints ====================

@router.get("/", response_model=List[AIGradingConfigResponse])
async def get_ai_grading_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all AI grading configurations (Admin only)
    """
    await verify_admin(current_user)
    
    result = await db.execute(select(AIGradingConfig).order_by(AIGradingConfig.skill_type))
    configs = result.scalars().all()
    
    return configs


@router.get("/{skill_type}", response_model=AIGradingConfigResponse)
async def get_ai_grading_config(
    skill_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI grading config by skill type (Admin only)
    """
    await verify_admin(current_user)
    
    result = await db.execute(
        select(AIGradingConfig).where(AIGradingConfig.skill_type == skill_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cấu hình cho {skill_type}"
        )
    
    return config


@router.post("/", response_model=AIGradingConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_grading_config(
    config_data: AIGradingConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new AI grading config (Admin only)
    """
    await verify_admin(current_user)
    
    # Validate skill_type
    if config_data.skill_type not in ['writing', 'speaking']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skill_type phải là 'writing' hoặc 'speaking'"
        )
    
    # Check if already exists
    result = await db.execute(
        select(AIGradingConfig).where(AIGradingConfig.skill_type == config_data.skill_type)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cấu hình cho {config_data.skill_type} đã tồn tại"
        )
    
    # Validate cost
    if config_data.cost_per_grading < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chi phí phải lớn hơn hoặc bằng 0"
        )
    
    # Create config
    config = AIGradingConfig(**config_data.model_dump())
    db.add(config)
    await db.commit()
    await db.refresh(config)
    
    return config


@router.put("/{skill_type}", response_model=AIGradingConfigResponse)
async def update_ai_grading_config(
    skill_type: str,
    config_data: AIGradingConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update AI grading config (Admin only)
    """
    await verify_admin(current_user)
    
    # Find config
    result = await db.execute(
        select(AIGradingConfig).where(AIGradingConfig.skill_type == skill_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cấu hình cho {skill_type}"
        )
    
    # Update fields
    update_data = config_data.model_dump(exclude_unset=True)
    
    # Validate cost if provided
    if 'cost_per_grading' in update_data and update_data['cost_per_grading'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chi phí phải lớn hơn hoặc bằng 0"
        )
    
    for field, value in update_data.items():
        setattr(config, field, value)
    
    config.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(config)
    
    return config


@router.delete("/{skill_type}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_grading_config(
    skill_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete AI grading config (Admin only)
    """
    await verify_admin(current_user)
    
    result = await db.execute(
        select(AIGradingConfig).where(AIGradingConfig.skill_type == skill_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cấu hình cho {skill_type}"
        )
    
    await db.delete(config)
    await db.commit()
    
    return None
