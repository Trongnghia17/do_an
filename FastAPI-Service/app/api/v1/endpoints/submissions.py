"""
API endpoints for exam submissions and user answers
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.models.exam_models import (
    ExamSubmission, UserExamAnswer, ExamQuestion, 
    ExamSkill, ExamSection, SubmissionStatus, ExamQuestionGroup
)
from app.database import get_db
from app.auth import get_current_user
from app.models.auth_models import User
from loguru import logger

router = APIRouter()


# ============================================
# PYDANTIC MODELS
# ============================================

class AnswerSubmitRequest(BaseModel):
    """Request model for submitting an answer"""
    question_id: int
    answer_text: Optional[str] = None
    answer_audio: Optional[str] = None


class SubmissionCreateRequest(BaseModel):
    """Request model for creating a submission"""
    exam_skill_id: int
    exam_section_id: Optional[int] = None
    answers: List[AnswerSubmitRequest]
    time_spent: Optional[int] = None  # seconds


class AnswerResponse(BaseModel):
    """Response model for answer"""
    id: int
    question_id: int
    answer_text: Optional[str]
    answer_audio: Optional[str]
    is_correct: Optional[bool]
    score: Optional[float]
    ai_feedback: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    """Response model for submission"""
    id: int
    user_id: int
    exam_skill_id: int
    exam_section_id: Optional[int]
    status: str
    started_at: datetime
    submitted_at: Optional[datetime]
    time_spent: Optional[int]
    total_score: Optional[float]
    max_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    answers: Optional[List[AnswerResponse]] = None
    
    # Additional fields for display
    skill_name: Optional[str] = None
    skill_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class SubmissionDetailResponse(BaseModel):
    """Detailed response model for submission with grading - Flattened for frontend"""
    # Submission basic info
    id: int
    user_id: int
    exam_skill_id: int
    exam_section_id: Optional[int]
    status: str
    started_at: datetime
    submitted_at: Optional[datetime]
    time_spent: Optional[int]
    total_score: Optional[float]
    max_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    # Skill and section info
    skill: Optional[Dict[str, Any]] = None  # Contains skill_type, name, etc.
    exam: Optional[Dict[str, Any]] = None
    section_name: Optional[str] = None
    
    # Statistics
    total_questions: int
    answered_questions: int
    correct_answers: Optional[int] = None
    
    # Teacher grading (for speaking/writing)
    teacher_score: Optional[float] = None
    teacher_feedback: Optional[str] = None
    
    # Answers with details
    answers: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True


# ============================================
# API ENDPOINTS
# ============================================

@router.post("/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_exam(
    request: SubmissionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit exam answers
    
    This endpoint:
    - Creates a new submission record
    - Saves all user answers
    - Auto-grades multiple choice questions
    - Returns submission with initial grading
    """
    try:
        logger.info(f"User {current_user.id} submitting exam skill {request.exam_skill_id}")
        
        # Verify exam skill exists
        skill_result = await db.execute(
            select(ExamSkill).where(
                ExamSkill.id == request.exam_skill_id,
                ExamSkill.deleted_at.is_(None)
            )
        )
        skill = skill_result.scalar_one_or_none()
        
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam skill not found"
            )
        
        # Verify section if provided
        if request.exam_section_id:
            section_result = await db.execute(
                select(ExamSection).where(
                    ExamSection.id == request.exam_section_id,
                    ExamSection.deleted_at.is_(None)
                )
            )
            section = section_result.scalar_one_or_none()
            
            if not section:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Exam section not found"
                )
        
        # Create submission
        submission = ExamSubmission(
            user_id=current_user.id,
            exam_skill_id=request.exam_skill_id,
            exam_section_id=request.exam_section_id,
            status=SubmissionStatus.COMPLETED,
            started_at=datetime.utcnow(),
            submitted_at=datetime.utcnow(),
            time_spent=request.time_spent,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(submission)
        await db.flush()  # Get submission ID
        
        # Save answers and calculate score
        total_score = 0
        max_score = 0
        
        for answer_data in request.answers:
            # Get question to check correct answer
            question_result = await db.execute(
                select(ExamQuestion).where(
                    ExamQuestion.id == answer_data.question_id,
                    ExamQuestion.deleted_at.is_(None)
                )
            )
            question = question_result.scalar_one_or_none()
            
            if not question:
                logger.warning(f"Question {answer_data.question_id} not found, skipping")
                continue
            
            # Check if answer is correct (for multiple choice and fill in blank)
            is_correct = None
            score = None
            
            print(f"🎯 Q{answer_data.question_id}: question_type='{question.question_type}', correct_answer='{question.correct_answer}'")
            
            if question.question_type in ["multiple_choice", "fill_blank", "true_false", "yes_no", "yes_no_not_given"] and question.correct_answer:
                user_answer = (answer_data.answer_text or "").strip().lower()
                correct_answer = (question.correct_answer or "").strip().lower()
                is_correct = user_answer == correct_answer
                score = question.points if is_correct else 0
                total_score += score
                print(f"✅ Q{answer_data.question_id}: user='{user_answer}', correct='{correct_answer}', is_correct={is_correct}, score={score}")
            
            max_score += question.points
            
            # Create answer record
            user_answer = UserExamAnswer(
                submission_id=submission.id,
                question_id=answer_data.question_id,
                answer_text=answer_data.answer_text,
                answer_audio=answer_data.answer_audio,
                is_correct=is_correct,
                score=score,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(user_answer)
        
        # Update submission with scores
        submission.total_score = total_score
        submission.max_score = max_score
        
        # If all questions are auto-graded, mark as graded
        if skill.skill_type in ["reading", "listening"]:
            submission.status = SubmissionStatus.GRADED
        
        await db.commit()
        await db.refresh(submission)
        
        # Load answers for response
        answers_result = await db.execute(
            select(UserExamAnswer).where(
                UserExamAnswer.submission_id == submission.id,
                UserExamAnswer.deleted_at.is_(None)
            )
        )
        answers = answers_result.scalars().all()
        
        return SubmissionResponse(
            id=submission.id,
            user_id=submission.user_id,
            exam_skill_id=submission.exam_skill_id,
            exam_section_id=submission.exam_section_id,
            status=submission.status,
            started_at=submission.started_at,
            submitted_at=submission.submitted_at,
            time_spent=submission.time_spent,
            total_score=submission.total_score,
            max_score=submission.max_score,
            created_at=submission.created_at,
            updated_at=submission.updated_at,
            answers=[
                AnswerResponse(
                    id=ans.id,
                    question_id=ans.question_id,
                    answer_text=ans.answer_text,
                    answer_audio=ans.answer_audio,
                    is_correct=ans.is_correct,
                    score=ans.score,
                    ai_feedback=json.loads(ans.ai_feedback) if ans.ai_feedback else None,
                    created_at=ans.created_at
                )
                for ans in answers
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting exam: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit exam: {str(e)}"
        )


@router.get("/my-submissions", response_model=List[SubmissionResponse])
async def get_my_submissions(
    exam_skill_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all submissions for current user
    
    Optional filters:
    - exam_skill_id: Filter by specific skill
    - status_filter: Filter by status (in_progress, completed, graded)
    """
    try:
        # Build query
        conditions = [
            ExamSubmission.user_id == current_user.id,
            ExamSubmission.deleted_at.is_(None)
        ]
        
        if exam_skill_id:
            conditions.append(ExamSubmission.exam_skill_id == exam_skill_id)
        
        if status_filter:
            conditions.append(ExamSubmission.status == status_filter)
        
        try:
            result = await db.execute(
                select(ExamSubmission)
                .where(and_(*conditions))
                .order_by(ExamSubmission.created_at.desc())
            )
            submissions = result.scalars().all()
        except Exception as db_error:
            # If table doesn't exist, return empty list
            logger.error(f"Database error (table might not exist): {str(db_error)}")
            return []
        
        # Get skill information for each submission
        response_list = []
        for sub in submissions:
            try:
                # Get skill data
                skill_result = await db.execute(
                    select(ExamSkill).where(ExamSkill.id == sub.exam_skill_id)
                )
                skill = skill_result.scalar_one_or_none()
                
                response_list.append(
                    SubmissionResponse(
                        id=sub.id,
                        user_id=sub.user_id,
                        exam_skill_id=sub.exam_skill_id,
                        exam_section_id=sub.exam_section_id,
                        status=sub.status,
                        started_at=sub.started_at,
                        submitted_at=sub.submitted_at,
                        time_spent=sub.time_spent,
                        total_score=sub.total_score,
                        max_score=sub.max_score,
                        created_at=sub.created_at,
                        updated_at=sub.updated_at,
                        skill_name=skill.name if skill else None,
                        skill_type=skill.skill_type.value if skill else None
                    )
                )
            except Exception as item_error:
                logger.error(f"Error processing submission {sub.id}: {str(item_error)}")
                continue
        
        return response_list
        
    except Exception as e:
        logger.error(f"Error fetching submissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch submissions: {str(e)}"
        )


@router.get("/{submission_id}")
async def get_submission_detail(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed submission with all answers and grading
    """
    try:
        # Get submission
        result = await db.execute(
            select(ExamSubmission).where(
                ExamSubmission.id == submission_id,
                ExamSubmission.user_id == current_user.id,
                ExamSubmission.deleted_at.is_(None)
            )
        )
        submission = result.scalar_one_or_none()
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Get ALL questions from the skill (not just answered ones)
        questions_result = await db.execute(
            select(ExamQuestion, ExamQuestionGroup, ExamSection)
            .join(ExamQuestionGroup, ExamQuestion.question_group_id == ExamQuestionGroup.id)
            .join(ExamSection, ExamQuestionGroup.exam_section_id == ExamSection.id)
            .where(
                ExamSection.exam_skill_id == submission.exam_skill_id,
                ExamQuestion.deleted_at.is_(None),
                ExamQuestionGroup.deleted_at.is_(None),
                ExamSection.deleted_at.is_(None)
            )
            .order_by(ExamSection.id, ExamQuestion.id)
        )
        all_questions = questions_result.all()
        
        # Get user's answers
        answers_result = await db.execute(
            select(UserExamAnswer)
            .where(
                UserExamAnswer.submission_id == submission_id,
                UserExamAnswer.deleted_at.is_(None)
            )
        )
        user_answers = {ans.question_id: ans for ans in answers_result.scalars().all()}
        
        # Get skill info
        skill_result = await db.execute(
            select(ExamSkill).where(ExamSkill.id == submission.exam_skill_id)
        )
        skill = skill_result.scalar_one_or_none()
        
        # Get section name if applicable
        section_name = None
        if submission.exam_section_id:
            section_result = await db.execute(
                select(ExamSection).where(ExamSection.id == submission.exam_section_id)
            )
            section = section_result.scalar_one_or_none()
            if section:
                section_name = section.name
        
        # Process ALL questions and merge with user answers
        answers_list = []
        correct_count = 0
        overall_question_number = 1
        
        for question, question_group, section in all_questions:
            # Get user's answer for this question (if exists)
            user_answer = user_answers.get(question.id)
            
            # Determine correctness
            is_correct = False
            if user_answer:
                is_correct = user_answer.is_correct if user_answer.is_correct is not None else False
                if is_correct:
                    correct_count += 1
            
            # Get correct answer - convert to letter if it's a multiple choice question
            correct_answer = question.correct_answer or "N/A"
            
            # If question has options (multiple choice), find the letter key for correct answer
            if question.options:
                try:
                    options = json.loads(question.options) if isinstance(question.options, str) else question.options
                    
                    # Options can be:
                    # 1. List of objects: [{"answer_content": "...", "is_correct": true/false}, ...]
                    # 2. Dict: {"A": "...", "B": "..."}
                    
                    if isinstance(options, list) and len(options) > 0:
                        # Find the index of the correct answer (where is_correct=true)
                        for idx, option in enumerate(options):
                            if isinstance(option, dict) and option.get('is_correct'):
                                # Convert index to letter: 0→A, 1→B, 2→C, 3→D
                                correct_answer = chr(65 + idx)  # 65 is ASCII for 'A'
                                print(f"✅ Q{question.id}: Found correct answer at index {idx} → {correct_answer}")
                                break
                    
                    elif isinstance(options, dict):
                        # Dict format - find key that matches correct_answer value
                        correct_answer_normalized = str(question.correct_answer).strip().lower()
                        for key, value in options.items():
                            value_normalized = str(value).strip().lower()
                            if value_normalized == correct_answer_normalized:
                                correct_answer = key
                                print(f"✅ Q{question.id}: Found match - key={key}")
                                break
                        
                except (json.JSONDecodeError, TypeError, AttributeError) as e:
                    logger.warning(f"Failed to parse options for question {question.id}: {e}")
                    pass  # Keep the original correct_answer if parsing fails
            
            # Get part name from section
            part_name = section.name if section else "Part 1"
            
            answers_list.append({
                "question_id": question.id,
                "question_number": overall_question_number,
                "part": part_name,
                "question_content": question.question_text or question.content or "",  # Add question content
                "user_answer": user_answer.answer_text if user_answer and user_answer.answer_text else "",
                "answer_audio": user_answer.answer_audio if user_answer and user_answer.answer_audio else None,  # Add audio URL
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "score": user_answer.score if user_answer else None,
                "ai_feedback": json.loads(user_answer.ai_feedback) if (user_answer and user_answer.ai_feedback) else None,
                "has_ai_grading": bool(user_answer and user_answer.ai_feedback)  # Flag để frontend biết đã có AI grading
            })
            overall_question_number += 1
        
        # Count questions
        total_questions = len(answers_list)
        answered_questions = sum(1 for ans in answers_list if (ans["user_answer"] or ans.get("answer_audio")))
        
        response_data = {
            "id": submission.id,
            "user_id": submission.user_id,
            "exam_skill_id": submission.exam_skill_id,
            "exam_section_id": submission.exam_section_id,
            "status": submission.status,
            "started_at": submission.started_at.isoformat() if submission.started_at else None,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "time_spent": submission.time_spent or 0,
            "total_score": submission.total_score,
            "max_score": submission.max_score,
            "created_at": submission.created_at.isoformat() if submission.created_at else None,
            "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
            "skill": {
                "name": skill.name if skill else None,
                "skill_type": skill.skill_type.value if skill else None
            },
            "exam": None,  # TODO: Add exam info if needed
            "section_name": section_name,
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "correct_answers": correct_count,
            "teacher_score": getattr(submission, 'teacher_score', None),
            "teacher_feedback": getattr(submission, 'teacher_feedback', None),
            "answers": answers_list
        }
        
        return {"success": True, "data": response_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching submission detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch submission detail: {str(e)}"
        )
