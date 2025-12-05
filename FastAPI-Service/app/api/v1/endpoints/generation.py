from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.chatgpt_service import chatgpt_service
from app.models.exam_models import Exam, ExamTest, ExamSkill, ExamSection, ExamQuestionGroup, ExamQuestion
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User
from loguru import logger

router = APIRouter()


class QuestionGenerationRequest(BaseModel):
    """Request body for question generation"""
    exam_type: str  # IELTS, TOEIC, etc.
    skill: str  # Listening, Reading, Writing, Speaking
    topic: str
    difficulty: str  # easy, medium, hard
    num_questions: int = 5
    question_types: Optional[List[str]] = None


class QuestionGenerationResponse(BaseModel):
    """Response for question generation"""
    status: str
    message: str
    questions: List[Dict[str, Any]]
    metadata: Dict[str, Any]


@router.post("/generate-questions", response_model=QuestionGenerationResponse)
async def generate_questions(
    request: QuestionGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Sinh câu hỏi tự động bằng ChatGPT API
    
    Endpoint này sử dụng AI để tạo câu hỏi thi dựa trên:
    - Loại đề thi (IELTS, TOEIC, etc.)
    - Kỹ năng (Listening, Reading, Writing, Speaking)
    - Chủ đề và độ khó
    """
    try:
        logger.info(
            f"Generating questions: {request.exam_type} - {request.skill} - {request.topic}"
        )
        
        questions = await chatgpt_service.generate_exam_questions(
            exam_type=request.exam_type,
            skill=request.skill,
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            question_types=request.question_types,
        )
        
        return QuestionGenerationResponse(
            status="success",
            message=f"Successfully generated {len(questions)} questions",
            questions=questions,
            metadata={
                "exam_type": request.exam_type,
                "skill": request.skill,
                "topic": request.topic,
                "difficulty": request.difficulty,
            },
        )
        
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )


class ContentGenerationRequest(BaseModel):
    """Request for generating exam content (passages, scenarios, etc.)"""
    content_type: str  # passage, dialogue, scenario
    skill: str
    topic: str
    difficulty: str
    word_count: Optional[int] = 200


class ContentGenerationResponse(BaseModel):
    """Response for content generation"""
    status: str
    content: str
    metadata: Dict[str, Any]


@router.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_exam_content(
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Sinh nội dung cho đề thi (đoạn văn, hội thoại, etc.)
    
    Dùng cho Reading passages, Listening dialogues, Writing prompts
    """
    try:
        prompt = f"""
Generate a {request.content_type} for an English exam.

Type: {request.content_type}
Skill: {request.skill}
Topic: {request.topic}
Difficulty: {request.difficulty}
Word count: approximately {request.word_count} words

Requirements:
- Make it engaging and realistic
- Appropriate for the difficulty level
- Follow standard exam format
- Include natural language use

Provide the content in plain text format.
"""

        messages = [
            {
                "role": "system",
                "content": "You are an expert content creator for English language exams.",
            },
            {"role": "user", "content": prompt},
        ]
        
        content = await chatgpt_service.generate_completion(messages)
        
        return ContentGenerationResponse(
            status="success",
            content=content,
            metadata={
                "content_type": request.content_type,
                "skill": request.skill,
                "topic": request.topic,
                "difficulty": request.difficulty,
                "word_count": len(content.split()),
            },
        )
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}"
        )


class ExamGenerationRequest(BaseModel):
    """Request for generating complete exam"""
    exam_name: str
    exam_type: str
    test_name: str
    sections: List[Dict[str, Any]]  # List of sections with requirements


class ExamGenerationResponse(BaseModel):
    """Response for exam generation"""
    status: str
    message: str
    task_id: str
    exam_id: Optional[int] = None


@router.post("/generate-exam", response_model=ExamGenerationResponse)
async def generate_complete_exam(
    request: ExamGenerationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sinh toàn bộ đề thi tự động
    
    Endpoint này tạo một đề thi hoàn chỉnh với nhiều sections và questions
    Process chạy background để tránh timeout
    """
    try:
        # Create exam structure first
        exam = Exam(
            name=request.exam_name,
            type=request.exam_type,
            description=f"AI Generated exam: {request.exam_name}",
            is_active=False  # Set inactive until generation completes
        )
        db.add(exam)
        await db.commit()
        await db.refresh(exam)
        
        # Create exam test
        exam_test = ExamTest(
            exam_id=exam.id,
            name=request.test_name,
            description=f"AI Generated test",
            is_active=False
        )
        db.add(exam_test)
        await db.commit()
        await db.refresh(exam_test)
        
        # Generate task ID
        task_id = f"exam_gen_{exam.id}_{int(datetime.utcnow().timestamp())}"
        
        # Add background task for question generation
        background_tasks.add_task(
            generate_exam_background,
            task_id,
            exam.id,
            exam_test.id,
            request.sections,
            db
        )
        
        return ExamGenerationResponse(
            status="processing",
            message="Exam generation started in background",
            task_id=task_id,
            exam_id=exam.id
        )
        
    except Exception as e:
        logger.error(f"Error starting exam generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start exam generation: {str(e)}"
        )


async def generate_exam_background(
    task_id: str,
    exam_id: int,
    exam_test_id: int,
    sections: List[Dict[str, Any]],
    db: AsyncSession
):
    """Background task for generating complete exam"""
    try:
        logger.info(f"Background exam generation started: {task_id}")
        
        for section_config in sections:
            # Create skill
            skill = ExamSkill(
                exam_test_id=exam_test_id,
                skill_type=section_config.get("skill", "reading").lower(),
                name=section_config.get("skill", "Reading"),
                time_limit=section_config.get("time_limit", 60)
            )
            db.add(skill)
            await db.commit()
            await db.refresh(skill)
            
            # Create section
            section = ExamSection(
                exam_skill_id=skill.id,
                name=f"Section 1",
                order=1
            )
            db.add(section)
            await db.commit()
            await db.refresh(section)
            
            # Generate questions via AI
            questions = await chatgpt_service.generate_exam_questions(
                exam_type=section_config.get("exam_type", "IELTS"),
                skill=section_config.get("skill", "Reading"),
                topic=section_config.get("topic", "General"),
                difficulty=section_config.get("difficulty", "medium"),
                num_questions=section_config.get("num_questions", 10),
                question_types=section_config.get("question_types"),
            )
            
            # Create question group
            group = ExamQuestionGroup(
                exam_section_id=section.id,
                name=f"Questions 1-{len(questions)}",
                order=1
            )
            db.add(group)
            await db.commit()
            await db.refresh(group)
            
            # Save questions to database
            for idx, q in enumerate(questions, 1):
                question = ExamQuestion(
                    question_group_id=group.id,
                    question_text=q.get("question_text", ""),
                    question_type=q.get("type", "multiple_choice"),
                    order=idx
                )
                db.add(question)
            
            await db.commit()
        
        # Activate exam after generation
        exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
        exam = exam_result.scalar_one()
        exam.is_active = True
        await db.commit()
        
        logger.info(f"Exam generation completed: {task_id}")
        
    except Exception as e:
        logger.error(f"Error in background exam generation: {str(e)}")
