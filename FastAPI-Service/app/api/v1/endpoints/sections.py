from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.exam_models import ExamSection, ExamSkill, ExamQuestionGroup
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User

router = APIRouter()


class SectionResponse(BaseModel):
    id: int
    exam_skill_id: int
    name: str
    content: Optional[str]
    content_format: str
    order_index: int
    audio_file: Optional[str] = None
    video_file: Optional[str] = None
    feedback: Optional[str] = None
    created_at: datetime
    question_groups_count: int = 0
    
    class Config:
        from_attributes = True


class SectionCreateRequest(BaseModel):
    name: str
    content: Optional[str] = None
    content_format: str = "text"
    order_index: int
    audio_file: Optional[str] = None
    video_file: Optional[str] = None
    feedback: Optional[str] = None


class SectionUpdateRequest(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    content_format: Optional[str] = None
    order_index: Optional[int] = None
    audio_file: Optional[str] = None
    video_file: Optional[str] = None
    feedback: Optional[str] = None


@router.get("/skills/{skill_id}/sections", response_model=List[SectionResponse])
async def list_sections(
    skill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all sections for a skill"""
    # Check if skill exists
    result = await db.execute(
        select(ExamSkill).where(ExamSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # Get sections
    query = select(ExamSection).where(
        ExamSection.exam_skill_id == skill_id
    ).order_by(ExamSection.order_index)
    
    result = await db.execute(query)
    sections = result.scalars().all()
    
    # Get question groups count for each section
    response_sections = []
    for section in sections:
        count_query = select(func.count(ExamQuestionGroup.id)).where(
            ExamQuestionGroup.exam_section_id == section.id
        )
        count_result = await db.execute(count_query)
        question_groups_count = count_result.scalar()
        
        response_sections.append({
            "id": section.id,
            "exam_skill_id": section.exam_skill_id,
            "name": section.name,
            "content": section.content,
            "content_format": section.content_format,
            "order_index": section.order_index,
            "audio_file": section.audio_file,
            "video_file": section.video_file,
            "feedback": section.feedback,
            "created_at": section.created_at,
            "question_groups_count": question_groups_count
        })
    
    return response_sections


@router.get("/sections/{section_id}", response_model=SectionResponse)
async def get_section(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get section by ID"""
    result = await db.execute(
        select(ExamSection).where(ExamSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    # Get question groups count
    count_query = select(func.count(ExamQuestionGroup.id)).where(
        ExamQuestionGroup.exam_section_id == section.id
    )
    count_result = await db.execute(count_query)
    question_groups_count = count_result.scalar()
    
    return {
        "id": section.id,
        "exam_skill_id": section.exam_skill_id,
        "name": section.name,
        "content": section.content,
        "content_format": section.content_format,
        "order_index": section.order_index,
        "audio_file": section.audio_file,
        "video_file": section.video_file,
        "feedback": section.feedback,
        "created_at": section.created_at,
        "question_groups_count": question_groups_count
    }


@router.post("/skills/{skill_id}/sections", response_model=SectionResponse)
async def create_section(
    skill_id: int,
    section_data: SectionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new section"""
    # Check if skill exists
    result = await db.execute(
        select(ExamSkill).where(ExamSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # Create section
    new_section = ExamSection(
        exam_skill_id=skill_id,
        name=section_data.name,
        content=section_data.content,
        content_format=section_data.content_format,
        order_index=section_data.order_index,
        audio_file=section_data.audio_file,
        video_file=section_data.video_file,
        feedback=section_data.feedback,
    )
    
    db.add(new_section)
    await db.commit()
    await db.refresh(new_section)
    
    return {
        "id": new_section.id,
        "exam_skill_id": new_section.exam_skill_id,
        "name": new_section.name,
        "content": new_section.content,
        "content_format": new_section.content_format,
        "order_index": new_section.order_index,
        "audio_file": new_section.audio_file,
        "video_file": new_section.video_file,
        "feedback": new_section.feedback,
        "created_at": new_section.created_at,
        "question_groups_count": 0
    }


@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: int,
    section_data: SectionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update section"""
    result = await db.execute(
        select(ExamSection).where(ExamSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    # Update fields
    if section_data.name is not None:
        section.name = section_data.name
    if section_data.content is not None:
        section.content = section_data.content
    if section_data.content_format is not None:
        section.content_format = section_data.content_format
    if section_data.order_index is not None:
        section.order_index = section_data.order_index
    if section_data.audio_file is not None:
        section.audio_file = section_data.audio_file
    if section_data.video_file is not None:
        section.video_file = section_data.video_file
    if section_data.feedback is not None:
        section.feedback = section_data.feedback
    
    await db.commit()
    await db.refresh(section)
    
    # Get question groups count
    count_query = select(func.count(ExamQuestionGroup.id)).where(
        ExamQuestionGroup.exam_section_id == section.id
    )
    count_result = await db.execute(count_query)
    question_groups_count = count_result.scalar()
    
    return {
        "id": section.id,
        "exam_skill_id": section.exam_skill_id,
        "name": section.name,
        "content": section.content,
        "content_format": section.content_format,
        "order_index": section.order_index,
        "audio_file": section.audio_file,
        "video_file": section.video_file,
        "feedback": section.feedback,
        "created_at": section.created_at,
        "question_groups_count": question_groups_count
    }


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete section"""
    result = await db.execute(
        select(ExamSection).where(ExamSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    await db.delete(section)
    await db.commit()
    
    return {"message": "Section deleted successfully"}
