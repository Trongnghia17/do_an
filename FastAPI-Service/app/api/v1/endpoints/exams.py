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


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get exam by ID"""
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.deleted_at.is_(None))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    return exam


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: int,
    exam_data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update exam"""
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.deleted_at.is_(None))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam.name = exam_data.name
    exam.type = exam_data.type
    exam.description = exam_data.description
    exam.image = exam_data.image
    exam.is_active = exam_data.is_active
    exam.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(exam)
    
    return exam


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete exam (soft delete)"""
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.deleted_at.is_(None))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam.deleted_at = datetime.utcnow()
    await db.commit()
    
    return None


# ========== ExamTest Endpoints ==========

class ExamTestCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True


class ExamTestResponse(BaseModel):
    id: int
    exam_id: int
    name: str
    description: Optional[str]
    image: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/{exam_id}/tests", response_model=List[ExamTestResponse])
async def list_exam_tests(
    exam_id: int,
    db: AsyncSession = Depends(get_db)
):
    """List all tests in an exam"""
    # Verify exam exists
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.deleted_at.is_(None))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get tests
    result = await db.execute(
        select(ExamTest)
        .where(ExamTest.exam_id == exam_id, ExamTest.deleted_at.is_(None))
        .order_by(ExamTest.created_at.desc())
    )
    tests = result.scalars().all()
    
    return tests


@router.post("/{exam_id}/tests", response_model=ExamTestResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_test(
    exam_id: int,
    test_data: ExamTestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new test in exam"""
    # Verify exam exists
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id, Exam.deleted_at.is_(None))
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Create test
    test = ExamTest(
        exam_id=exam_id,
        name=test_data.name,
        description=test_data.description,
        image=test_data.image,
        is_active=test_data.is_active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(test)
    await db.commit()
    await db.refresh(test)
    
    return test


@router.put("/{exam_id}/tests/{test_id}", response_model=ExamTestResponse)
async def update_exam_test(
    exam_id: int,
    test_id: int,
    test_data: ExamTestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update exam test"""
    result = await db.execute(
        select(ExamTest).where(
            ExamTest.id == test_id,
            ExamTest.exam_id == exam_id,
            ExamTest.deleted_at.is_(None)
        )
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.name = test_data.name
    test.description = test_data.description
    test.image = test_data.image
    test.is_active = test_data.is_active
    test.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(test)
    
    return test


@router.delete("/{exam_id}/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam_test(
    exam_id: int,
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete exam test (soft delete)"""
    result = await db.execute(
        select(ExamTest).where(
            ExamTest.id == test_id,
            ExamTest.exam_id == exam_id,
            ExamTest.deleted_at.is_(None)
        )
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.deleted_at = datetime.utcnow()
    await db.commit()
    
    return None
