from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.exam_models import ExamSkill, ExamTest, Exam, SkillType
from app.database import get_db
from app.auth import get_current_user, get_optional_user
from app.models.auth_models import User

router = APIRouter()


class SkillResponse(BaseModel):
    id: int
    exam_test_id: int
    name: str
    skill_type: str
    time_limit: Optional[int]
    description: Optional[str]
    image: Optional[str] = None
    is_active: bool
    is_online: bool
    created_at: datetime
    
    # Nested data
    exam_test_name: Optional[str] = None
    exam_id: Optional[int] = None
    exam_name: Optional[str] = None
    exam_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class SkillCreateRequest(BaseModel):
    exam_test_id: int
    name: str
    skill_type: str
    time_limit: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    is_online: bool = True


class SkillUpdateRequest(BaseModel):
    name: Optional[str] = None
    skill_type: Optional[str] = None
    time_limit: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None
    is_online: Optional[bool] = None


@router.get("/", response_model=List[SkillResponse])
async def list_skills(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    skill_type: Optional[str] = Query(None),
    exam_id: Optional[int] = Query(None),
    exam_test_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_online: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List all skills with filters (public endpoint - auth optional)"""
    # Calculate pagination
    skip = (page - 1) * per_page
    limit = per_page
    
    if limit > 100:
        limit = 100
    
    query = select(ExamSkill).join(ExamTest).join(Exam)
    
    # Apply filters
    if skill_type:
        query = query.where(ExamSkill.skill_type == skill_type)
    
    if exam_test_id:
        query = query.where(ExamSkill.exam_test_id == exam_test_id)
    
    if exam_id:
        query = query.where(ExamTest.exam_id == exam_id)
    
    if search:
        query = query.where(ExamSkill.name.ilike(f"%{search}%"))
    
    if is_online is not None:
        query = query.where(ExamSkill.is_online == is_online)
    
    query = query.offset(skip).limit(limit).order_by(ExamSkill.created_at.desc())
    
    result = await db.execute(query)
    skills = result.scalars().all()
    
    # Transform to response format with nested data
    response_skills = []
    for skill in skills:
        # Load relationships
        await db.refresh(skill, ['exam_test'])
        if skill.exam_test:
            await db.refresh(skill.exam_test, ['exam'])
        
        skill_dict = {
            "id": skill.id,
            "exam_test_id": skill.exam_test_id,
            "name": skill.name,
            "skill_type": skill.skill_type.value if hasattr(skill.skill_type, 'value') else skill.skill_type,
            "time_limit": skill.time_limit,
            "description": skill.description,
            "image": skill.image,
            "is_active": skill.is_active,
            "is_online": skill.is_online,
            "created_at": skill.created_at,
            "exam_test_name": skill.exam_test.name if skill.exam_test else None,
            "exam_id": skill.exam_test.exam_id if skill.exam_test else None,
            "exam_name": skill.exam_test.exam.name if skill.exam_test and skill.exam_test.exam else None,
            "exam_type": skill.exam_test.exam.type if skill.exam_test and skill.exam_test.exam else None,
        }
        response_skills.append(skill_dict)
    
    return response_skills


@router.get("/{skill_id}")
async def get_skill(
    skill_id: int,
    with_sections: bool = Query(False, description="Include sections and questions"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get skill by ID (public endpoint - auth optional)"""
    result = await db.execute(
        select(ExamSkill)
        .where(ExamSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # Load relationships
    await db.refresh(skill, ['exam_test'])
    if skill.exam_test:
        await db.refresh(skill.exam_test, ['exam'])
    
    response_data = {
        "id": skill.id,
        "exam_test_id": skill.exam_test_id,
        "name": skill.name,
        "skill_type": skill.skill_type.value if hasattr(skill.skill_type, 'value') else skill.skill_type,
        "time_limit": skill.time_limit,
        "description": skill.description,
        "is_active": skill.is_active,
        "is_online": skill.is_online,
        "created_at": skill.created_at,
        "exam_test_name": skill.exam_test.name if skill.exam_test else None,
        "exam_id": skill.exam_test.exam_id if skill.exam_test else None,
        "exam_name": skill.exam_test.exam.name if skill.exam_test and skill.exam_test.exam else None,
        "exam_type": skill.exam_test.exam.type if skill.exam_test and skill.exam_test.exam else None,
    }
    
    # If with_sections is True, include sections with questions
    if with_sections:
        await db.refresh(skill, ['exam_sections'])
        sections_data = []
        
        for section in skill.exam_sections:
            await db.refresh(section, ['question_groups'])
            
            question_groups_data = []
            for group in section.question_groups:
                await db.refresh(group, ['questions'])
                
                questions_data = []
                for question in group.questions:
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
            
            sections_data.append({
                "id": section.id,
                "title": section.name,
                "content": section.content,
                "question_groups": question_groups_data
            })
        
        response_data["sections"] = sections_data
    
    return {"success": True, "data": response_data}


@router.post("/", response_model=SkillResponse)
async def create_skill(
    skill_data: SkillCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new skill"""
    # Check if exam_test exists
    result = await db.execute(
        select(ExamTest).where(ExamTest.id == skill_data.exam_test_id)
    )
    exam_test = result.scalar_one_or_none()
    
    if not exam_test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam test not found"
        )
    
    # Create skill
    new_skill = ExamSkill(
        exam_test_id=skill_data.exam_test_id,
        name=skill_data.name,
        skill_type=skill_data.skill_type,
        time_limit=skill_data.time_limit,
        description=skill_data.description,
        image=skill_data.image,
        is_active=skill_data.is_active,
        is_online=skill_data.is_online,
    )
    
    db.add(new_skill)
    await db.commit()
    await db.refresh(new_skill)
    
    # Load relationships
    await db.refresh(new_skill, ['exam_test'])
    if new_skill.exam_test:
        await db.refresh(new_skill.exam_test, ['exam'])
    
    return {
        "id": new_skill.id,
        "exam_test_id": new_skill.exam_test_id,
        "name": new_skill.name,
        "skill_type": new_skill.skill_type.value if hasattr(new_skill.skill_type, 'value') else new_skill.skill_type,
        "time_limit": new_skill.time_limit,
        "description": new_skill.description,
        "image": new_skill.image,
        "is_active": new_skill.is_active,
        "is_online": new_skill.is_online,
        "created_at": new_skill.created_at,
        "exam_test_name": new_skill.exam_test.name if new_skill.exam_test else None,
        "exam_id": new_skill.exam_test.exam_id if new_skill.exam_test else None,
        "exam_name": new_skill.exam_test.exam.name if new_skill.exam_test and new_skill.exam_test.exam else None,
        "exam_type": new_skill.exam_test.exam.type if new_skill.exam_test and new_skill.exam_test.exam else None,
    }


@router.put("/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: int,
    skill_data: SkillUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update skill"""
    result = await db.execute(
        select(ExamSkill).where(ExamSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # Update fields
    if skill_data.name is not None:
        skill.name = skill_data.name
    if skill_data.skill_type is not None:
        skill.skill_type = skill_data.skill_type
    if skill_data.time_limit is not None:
        skill.time_limit = skill_data.time_limit
    if skill_data.description is not None:
        skill.description = skill_data.description
    if skill_data.image is not None:
        skill.image = skill_data.image
    if skill_data.is_active is not None:
        skill.is_active = skill_data.is_active
    if skill_data.is_online is not None:
        skill.is_online = skill_data.is_online
    
    await db.commit()
    await db.refresh(skill)
    
    # Load relationships
    await db.refresh(skill, ['exam_test'])
    if skill.exam_test:
        await db.refresh(skill.exam_test, ['exam'])
    
    return {
        "id": skill.id,
        "exam_test_id": skill.exam_test_id,
        "name": skill.name,
        "skill_type": skill.skill_type.value if hasattr(skill.skill_type, 'value') else skill.skill_type,
        "time_limit": skill.time_limit,
        "description": skill.description,
        "image": skill.image,
        "is_active": skill.is_active,
        "is_online": skill.is_online,
        "created_at": skill.created_at,
        "exam_test_name": skill.exam_test.name if skill.exam_test else None,
        "exam_id": skill.exam_test.exam_id if skill.exam_test else None,
        "exam_name": skill.exam_test.exam.name if skill.exam_test and skill.exam_test.exam else None,
        "exam_type": skill.exam_test.exam.type if skill.exam_test and skill.exam_test.exam else None,
    }


@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete skill"""
    result = await db.execute(
        select(ExamSkill).where(ExamSkill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    await db.delete(skill)
    await db.commit()
    
    return {"message": "Skill deleted successfully"}
