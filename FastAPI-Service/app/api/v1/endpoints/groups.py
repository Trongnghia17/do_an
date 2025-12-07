from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.exam_models import ExamQuestionGroup, ExamSection, ExamQuestion
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User

router = APIRouter()


class GroupResponse(BaseModel):
    """Response model for question group"""
    id: int
    exam_section_id: int
    name: str
    question_type: str
    content: Optional[str]
    created_at: datetime
    updated_at: datetime
    questions_count: int = 0

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    """Create group request"""
    name: str
    question_type: str = "multipleChoice"
    content: Optional[str] = None


class GroupUpdate(BaseModel):
    """Update group request"""
    name: Optional[str] = None
    question_type: Optional[str] = None
    content: Optional[str] = None


@router.get("/sections/{section_id}/groups", response_model=List[GroupResponse])
async def list_groups_by_section(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all question groups for a section"""
    # Check if section exists
    result = await db.execute(
        select(ExamSection).where(ExamSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    # Get groups
    query = select(ExamQuestionGroup).where(
        ExamQuestionGroup.exam_section_id == section_id,
        ExamQuestionGroup.deleted_at.is_(None)
    )
    
    result = await db.execute(query)
    groups = result.scalars().all()
    
    # Get questions count for each group
    response_groups = []
    for group in groups:
        count_query = select(func.count(ExamQuestion.id)).where(
            ExamQuestion.question_group_id == group.id,
            ExamQuestion.deleted_at.is_(None)
        )
        count_result = await db.execute(count_query)
        questions_count = count_result.scalar()
        
        response_groups.append({
            "id": group.id,
            "exam_section_id": group.exam_section_id,
            "name": group.name,
            "question_type": group.question_type,
            "content": group.content,
            "created_at": group.created_at,
            "updated_at": group.updated_at,
            "questions_count": questions_count
        })
    
    return response_groups


@router.get("/groups/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get question group by ID"""
    result = await db.execute(
        select(ExamQuestionGroup)
        .where(ExamQuestionGroup.id == group_id)
        .where(ExamQuestionGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question group not found"
        )
    
    # Get questions count
    count_query = select(func.count(ExamQuestion.id)).where(
        ExamQuestion.question_group_id == group.id,
        ExamQuestion.deleted_at.is_(None)
    )
    count_result = await db.execute(count_query)
    questions_count = count_result.scalar()
    
    return {
        "id": group.id,
        "exam_section_id": group.exam_section_id,
        "name": group.name,
        "question_type": group.question_type,
        "content": group.content,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "questions_count": questions_count
    }


@router.get("/groups/{group_id}/questions")
async def get_questions_by_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all questions for a question group"""
    # Check if group exists
    result = await db.execute(
        select(ExamQuestionGroup)
        .where(ExamQuestionGroup.id == group_id)
        .where(ExamQuestionGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question group not found"
        )
    
    # Get questions
    query = select(ExamQuestion).where(
        ExamQuestion.question_group_id == group_id,
        ExamQuestion.deleted_at.is_(None)
    )
    
    result = await db.execute(query)
    questions = result.scalars().all()
    
    return questions


@router.post("/sections/{section_id}/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    section_id: int,
    group_data: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new question group"""
    # Check if section exists
    result = await db.execute(
        select(ExamSection).where(ExamSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    # Create group
    group = ExamQuestionGroup(
        exam_section_id=section_id,
        name=group_data.name,
        question_type=group_data.question_type,
        content=group_data.content
    )
    
    db.add(group)
    await db.commit()
    await db.refresh(group)
    
    return {
        "id": group.id,
        "exam_section_id": group.exam_section_id,
        "name": group.name,
        "question_type": group.question_type,
        "content": group.content,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "questions_count": 0
    }


@router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_data: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update question group"""
    result = await db.execute(
        select(ExamQuestionGroup)
        .where(ExamQuestionGroup.id == group_id)
        .where(ExamQuestionGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question group not found"
        )
    
    # Update fields
    update_data = group_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    group.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(group)
    
    # Get questions count
    count_query = select(func.count(ExamQuestion.id)).where(
        ExamQuestion.question_group_id == group.id,
        ExamQuestion.deleted_at.is_(None)
    )
    count_result = await db.execute(count_query)
    questions_count = count_result.scalar()
    
    return {
        "id": group.id,
        "exam_section_id": group.exam_section_id,
        "name": group.name,
        "question_type": group.question_type,
        "content": group.content,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "questions_count": questions_count
    }


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete question group"""
    result = await db.execute(
        select(ExamQuestionGroup)
        .where(ExamQuestionGroup.id == group_id)
        .where(ExamQuestionGroup.deleted_at.is_(None))
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question group not found"
        )
    
    group.deleted_at = datetime.utcnow()
    await db.commit()
    
    return None
