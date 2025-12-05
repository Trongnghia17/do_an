from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.exam_models import Exam, ExamTest, ExamType
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User

router = APIRouter()


class ExamCreate(BaseModel):
    name: str
    type: ExamType
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True


class ExamResponse(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str]
    image: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[ExamResponse])
async def list_exams(
    skip: int = 0,
    limit: int = 20,
    type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all exams"""
    if limit > 100:
        limit = 100
    
    query = select(Exam).where(Exam.deleted_at.is_(None))
    
    if type:
        query = query.where(Exam.type == type)
    if is_active is not None:
        query = query.where(Exam.is_active == is_active)
    
    query = query.offset(skip).limit(limit).order_by(Exam.created_at.desc())
    
    result = await db.execute(query)
    exams = result.scalars().all()
    
    return exams


@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new exam"""
    exam = Exam(
        name=exam_data.name,
        type=exam_data.type,
        description=exam_data.description,
        image=exam_data.image,
        is_active=exam_data.is_active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    
    return exam
