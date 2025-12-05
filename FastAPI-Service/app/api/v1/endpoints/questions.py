from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.exam_models import ExamQuestion, ExamQuestionGroup
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User

router = APIRouter()


class QuestionResponse(BaseModel):
    """Response model for question"""
    id: int
    question_group_id: int
    question_text: str
    question_type: Optional[str]
    order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    """Create question request"""
    question_group_id: int
    question_text: str
    question_type: Optional[str] = None
    order: int = 0
    is_active: bool = True


class QuestionUpdate(BaseModel):
    """Update question request"""
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("/", response_model=List[QuestionResponse])
async def list_questions(
    skip: int = 0,
    limit: int = 100,
    question_group_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List questions with filters"""
    query = select(ExamQuestion).where(ExamQuestion.deleted_at.is_(None))
    
    if question_group_id is not None:
        query = query.where(ExamQuestion.question_group_id == question_group_id)
    
    if is_active is not None:
        query = query.where(ExamQuestion.is_active == is_active)
    
    query = query.offset(skip).limit(limit).order_by(ExamQuestion.order)
    
    result = await db.execute(query)
    questions = result.scalars().all()
    
    return questions


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get question by ID"""
    result = await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.id == question_id)
        .where(ExamQuestion.deleted_at.is_(None))
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return question


@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new question"""
    # Verify question group exists
    group_result = await db.execute(
        select(ExamQuestionGroup)
        .where(ExamQuestionGroup.id == question_data.question_group_id)
        .where(ExamQuestionGroup.deleted_at.is_(None))
    )
    if not group_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question group not found"
        )
    
    # Create question
    question = ExamQuestion(**question_data.model_dump())
    db.add(question)
    await db.commit()
    await db.refresh(question)
    
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update question"""
    result = await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.id == question_id)
        .where(ExamQuestion.deleted_at.is_(None))
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Update fields
    update_data = question_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(question, field, value)
    
    question.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(question)
    
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete question"""
    result = await db.execute(
        select(ExamQuestion)
        .where(ExamQuestion.id == question_id)
        .where(ExamQuestion.deleted_at.is_(None))
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    question.deleted_at = datetime.utcnow()
    await db.commit()
    
    return None
