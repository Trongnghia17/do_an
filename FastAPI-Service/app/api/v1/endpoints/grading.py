from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.services.chatgpt_service import chatgpt_service
from app.models.auth_models import User
from app.database import get_db
from app.auth import get_current_user
from loguru import logger

router = APIRouter()


class WritingGradingRequest(BaseModel):
    """Request for grading writing answers"""
    question_id: int
    question_text: str
    answer: str
    exam_type: str = "IELTS"
    criteria: Optional[Dict[str, Any]] = None


class SpeakingGradingRequest(BaseModel):
    """Request for grading speaking answers"""
    question_id: int
    question_text: str
    transcript: str  # Speech-to-text transcript
    exam_type: str = "IELTS"
    criteria: Optional[Dict[str, Any]] = None


class GradingResponse(BaseModel):
    """Response for grading"""
    status: str
    question_id: int
    overall_score: float
    criteria_scores: Dict[str, float]
    strengths: list
    weaknesses: list
    detailed_feedback: str
    suggestions: list


@router.post("/grade-writing", response_model=GradingResponse)
async def grade_writing(
    request: WritingGradingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chấm bài Writing tự động bằng ChatGPT
    
    Endpoint này:
    - Nhận câu trả lời Writing từ học sinh
    - Sử dụng AI để chấm điểm theo tiêu chí chuẩn
    - Trả về điểm số và feedback chi tiết
    """
    try:
        logger.info(f"Grading writing answer for question: {request.question_id}")
        
        result = await chatgpt_service.grade_writing_answer(
            question=request.question_text,
            answer=request.answer,
            exam_type=request.exam_type,
            criteria=request.criteria,
        )
        
        # Note: Saving to user_exam_answers table would require that table to exist
        # For now, just return the grading result
        
        return GradingResponse(
            status="success",
            question_id=request.question_id,
            overall_score=result.get("overall_score", 0),
            criteria_scores=result.get("criteria_scores", {}),
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            detailed_feedback=result.get("detailed_feedback", ""),
            suggestions=result.get("suggestions", []),
        )
        
    except Exception as e:
        logger.error(f"Error grading writing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade writing: {str(e)}"
        )


@router.post("/grade-speaking", response_model=GradingResponse)
async def grade_speaking(
    request: SpeakingGradingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chấm bài Speaking tự động bằng ChatGPT
    
    Endpoint này:
    - Nhận transcript của câu trả lời Speaking
    - Sử dụng AI để chấm điểm theo tiêu chí chuẩn
    - Trả về điểm số và feedback chi tiết
    """
    try:
        logger.info(f"Grading speaking answer for question: {request.question_id}")
        
        result = await chatgpt_service.grade_speaking_answer(
            question=request.question_text,
            transcript=request.transcript,
            exam_type=request.exam_type,
            criteria=request.criteria,
        )
        
        return GradingResponse(
            status="success",
            question_id=request.question_id,
            overall_score=result.get("overall_score", 0),
            criteria_scores=result.get("criteria_scores", {}),
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            detailed_feedback=result.get("detailed_feedback", ""),
            suggestions=result.get("suggestions", []),
        )
        
    except Exception as e:
        logger.error(f"Error grading speaking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade speaking: {str(e)}"
        )


class FeedbackRequest(BaseModel):
    """Request for getting feedback on any answer"""
    question_text: str
    user_answer: str
    correct_answer: str
    skill: str


class FeedbackResponse(BaseModel):
    """Response for feedback"""
    status: str
    feedback: str


@router.post("/feedback", response_model=FeedbackResponse)
async def get_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Cung cấp feedback chi tiết cho bất kỳ câu trả lời nào
    
    Dùng cho Listening và Reading sau khi học sinh submit
    """
    try:
        feedback = await chatgpt_service.provide_feedback(
            question=request.question_text,
            user_answer=request.user_answer,
            correct_answer=request.correct_answer,
            skill=request.skill,
        )
        
        return FeedbackResponse(
            status="success",
            feedback=feedback,
        )
        
    except Exception as e:
        logger.error(f"Error generating feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate feedback: {str(e)}"
        )


class BatchAnswerData(BaseModel):
    """Single answer data for batch grading"""
    question_id: int
    question: str
    answer: Optional[str] = None
    transcript: Optional[str] = None
    type: str  # "writing" or "speaking"
    exam_type: str = "IELTS"


class BatchGradingRequest(BaseModel):
    """Request for batch grading multiple answers"""
    answers: List[BatchAnswerData]


class BatchGradingResponse(BaseModel):
    """Response for batch grading"""
    status: str
    results: List[Dict[str, Any]]
    total_score: float
    num_graded: int


@router.post("/grade-batch", response_model=BatchGradingResponse)
async def grade_batch(
    request: BatchGradingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chấm hàng loạt câu trả lời (cho Writing và Speaking)
    
    Useful khi học sinh nộp toàn bộ bài thi
    """
    try:
        results = []
        total_score = 0
        
        for answer_data in request.answers:
            if answer_data.type == "writing":
                result = await chatgpt_service.grade_writing_answer(
                    question=answer_data.question,
                    answer=answer_data.answer or "",
                    exam_type=answer_data.exam_type,
                )
            elif answer_data.type == "speaking":
                result = await chatgpt_service.grade_speaking_answer(
                    question=answer_data.question,
                    transcript=answer_data.transcript or "",
                    exam_type=answer_data.exam_type,
                )
            else:
                logger.warning(f"Unknown answer type: {answer_data.type}")
                continue
            
            results.append({
                "question_id": answer_data.question_id,
                "result": result,
            })
            
            total_score += result.get("overall_score", 0)
        
        return BatchGradingResponse(
            status="success",
            results=results,
            total_score=total_score,
            num_graded=len(results),
        )
        
    except Exception as e:
        logger.error(f"Error in batch grading: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade batch: {str(e)}"
        )
