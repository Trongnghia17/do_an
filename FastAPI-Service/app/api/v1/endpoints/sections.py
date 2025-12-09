from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.exam_models import ExamSection, ExamSkill, ExamQuestionGroup
from app.database import get_db
from app.auth import get_current_user, get_optional_user
from app.models.auth_models import User

router = APIRouter()


class SectionResponse(BaseModel):
    id: int
    exam_skill_id: int
    name: str
    content: Optional[str] = None
    feedback: Optional[str] = None
    ui_layer: Optional[str] = None
    audio: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    question_groups_count: int = 0
    
    class Config:
        from_attributes = True


class SectionCreateRequest(BaseModel):
    name: str
    content: Optional[str] = None
    feedback: Optional[str] = None
    ui_layer: Optional[str] = None
    audio: Optional[str] = None


class SectionUpdateRequest(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    feedback: Optional[str] = None
    ui_layer: Optional[str] = None
    audio: Optional[str] = None


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
        ExamSection.exam_skill_id == skill_id,
        ExamSection.deleted_at.is_(None)
    )
    
    result = await db.execute(query)
    sections = result.scalars().all()
    
    # Get question groups count for each section
    response_sections = []
    for section in sections:
        count_query = select(func.count(ExamQuestionGroup.id)).where(
            ExamQuestionGroup.exam_section_id == section.id,
            ExamQuestionGroup.deleted_at.is_(None)
        )
        count_result = await db.execute(count_query)
        question_groups_count = count_result.scalar()
        
        response_sections.append({
            "id": section.id,
            "exam_skill_id": section.exam_skill_id,
            "name": section.name,
            "content": section.content,
            "feedback": section.feedback,
            "ui_layer": section.ui_layer,
            "audio": section.audio,
            "created_at": section.created_at,
            "updated_at": section.updated_at,
            "question_groups_count": question_groups_count
        })
    
    return response_sections


@router.get("/sections/{section_id}")
async def get_section(
    section_id: int,
    with_questions: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get section by ID (public endpoint - auth optional)"""
    from app.models.exam_models import ExamQuestion
    
    result = await db.execute(
        select(ExamSection).where(
            ExamSection.id == section_id,
            ExamSection.deleted_at.is_(None)
        )
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    response_data = {
        "id": section.id,
        "exam_skill_id": section.exam_skill_id,
        "title": section.name,
        "content": section.content,
        "feedback": section.feedback,
        "ui_layer": section.ui_layer,
        "audio": section.audio,
        "created_at": section.created_at,
        "updated_at": section.updated_at,
    }
    
    # If with_questions is True, include question groups and questions
    if with_questions:
        await db.refresh(section, ['question_groups'])
        
        question_groups_data = []
        for group in section.question_groups:
            if group.deleted_at is not None:
                continue
                
            await db.refresh(group, ['questions'])
            
            questions_data = []
            for question in group.questions:
                if question.deleted_at is not None:
                    continue
                    
                questions_data.append({
                    "id": question.id,
                    "content": question.question_text,
                    "answer_content": question.correct_answer,
                    "metadata": question.options
                })
            
            question_groups_data.append({
                "id": group.id,
                "name": group.name,
                "question_type": group.question_type,
                "content": group.content,
                "questions": questions_data
            })
        
        response_data["question_groups"] = question_groups_data
    
    return {"success": True, "data": response_data}


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
        feedback=section_data.feedback,
        ui_layer=section_data.ui_layer,
        audio=section_data.audio,
    )
    
    db.add(new_section)
    await db.commit()
    await db.refresh(new_section)
    
    return {
        "id": new_section.id,
        "exam_skill_id": new_section.exam_skill_id,
        "name": new_section.name,
        "content": new_section.content,
        "feedback": new_section.feedback,
        "ui_layer": new_section.ui_layer,
        "audio": new_section.audio,
        "created_at": new_section.created_at,
        "updated_at": new_section.updated_at,
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
    update_data = section_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(section, field, value)
    
    section.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(section)
    
    # Get question groups count
    count_query = select(func.count(ExamQuestionGroup.id)).where(
        ExamQuestionGroup.exam_section_id == section.id,
        ExamQuestionGroup.deleted_at.is_(None)
    )
    count_result = await db.execute(count_query)
    question_groups_count = count_result.scalar()
    
    return {
        "id": section.id,
        "exam_skill_id": section.exam_skill_id,
        "name": section.name,
        "content": section.content,
        "feedback": section.feedback,
        "ui_layer": section.ui_layer,
        "audio": section.audio,
        "created_at": section.created_at,
        "updated_at": section.updated_at,
        "question_groups_count": question_groups_count
    }


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete section"""
    result = await db.execute(
        select(ExamSection).where(
            ExamSection.id == section_id,
            ExamSection.deleted_at.is_(None)
        )
    )
    section = result.scalar_one_or_none()
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    section.deleted_at = datetime.utcnow()
    await db.commit()
    
    return None
