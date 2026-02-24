from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

from app.services.chatgpt_service import chatgpt_service
from app.models.auth_models import User
from app.models.exam_models import UserExamAnswer
from app.models.payment_models import UserWallet, AIGradingConfig, WalletTransaction
from app.database import get_db
from app.auth import get_current_user
from loguru import logger

router = APIRouter()


# ==================== Helper Functions ====================

async def get_ai_grading_cost(db: AsyncSession, skill_type: str) -> int:
    """Get AI grading cost for a skill type"""
    result = await db.execute(
        select(AIGradingConfig).where(
            AIGradingConfig.skill_type == skill_type,
            AIGradingConfig.is_active == True
        )
    )
    config = result.scalar_one_or_none()
    
    if not config:
        # Default cost if not configured
        return 50
    
    return config.cost_per_grading


async def deduct_ai_grading_cost(db: AsyncSession, user_id: int, skill_type: str) -> dict:
    """
    Deduct AI grading cost from user wallet and create transaction record
    Returns dict with cost and new_balance
    Raises HTTPException if insufficient balance
    """
    # Get cost
    cost = await get_ai_grading_cost(db, skill_type)
    
    # Get user wallet
    result = await db.execute(
        select(UserWallet).where(UserWallet.user_id == user_id)
    )
    wallet = result.scalar_one_or_none()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bạn chưa có ví. Vui lòng nạp tiền để sử dụng AI chấm điểm."
        )
    
    # Check balance
    if wallet.balance < cost:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Số dư không đủ. Cần {cost} Trứng Cú, bạn có {wallet.balance} Trứng Cú. Vui lòng nạp thêm."
        )
    
    # Store balance before
    balance_before = wallet.balance
    
    # Deduct balance
    wallet.balance -= cost
    wallet.total_spent += cost
    wallet.updated_at = datetime.utcnow()
    
    # Create transaction record
    transaction = WalletTransaction(
        user_id=user_id,
        amount=-cost,  # Negative for deduction
        transaction_type='AI_GRADING',
        description=f'Chấm điểm AI - {skill_type.upper()}',
        reference_id=None,  # Could add exam_id or answer_id later
        balance_before=balance_before,
        balance_after=wallet.balance,
        created_at=datetime.utcnow()
    )
    db.add(transaction)
    
    await db.commit()
    await db.refresh(wallet)
    
    logger.info(f"Deducted {cost} OWL from user {user_id} for {skill_type} AI grading. New balance: {wallet.balance}")
    
    return {
        "cost": cost,
        "new_balance": wallet.balance
    }


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
    """Response for grading with detailed IELTS band descriptors"""
    status: str
    question_id: int
    overall_band: float  # Changed from overall_score to match IELTS terminology
    criteria_scores: Dict[str, float]
    criteria_feedback: Optional[Dict[str, str]] = None  # Feedback chi tiết cho từng tiêu chí
    strengths: list
    weaknesses: list
    detailed_feedback: str
    suggestions: list
    band_justification: Optional[str] = None  # Giải thích tại sao đạt band này
    pronunciation_note: Optional[str] = None  # Chỉ cho Speaking


@router.post("/grade-writing", response_model=GradingResponse)
async def grade_writing(
    request: WritingGradingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chấm bài Writing tự động bằng ChatGPT
    
    Endpoint này:
    - Kiểm tra số dư ví
    - Trừ Trứng Cú từ ví
    - Sử dụng AI để chấm điểm theo tiêu chí chuẩn
    - Trả về điểm số và feedback chi tiết
    """
    try:
        logger.info(f"Grading writing answer for question: {request.question_id}")
        
        # Deduct cost from wallet BEFORE grading
        payment_info = await deduct_ai_grading_cost(db, current_user.id, "writing")
        
        # Grade with AI
        result = await chatgpt_service.grade_writing_answer(
            question=request.question_text,
            answer=request.answer,
            exam_type=request.exam_type,
            criteria=request.criteria,
        )
        
        logger.info(f"Writing graded successfully. Cost: {payment_info['cost']} OWL, New balance: {payment_info['new_balance']}")
        
        return GradingResponse(
            status="success",
            question_id=request.question_id,
            overall_band=result.get("overall_score", 0),
            criteria_scores=result.get("criteria_scores", {}),
            criteria_feedback=result.get("criteria_feedback", {}),
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            detailed_feedback=result.get("detailed_feedback", ""),
            suggestions=result.get("suggestions", []),
            band_justification=result.get("band_justification"),
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like insufficient balance)
        raise
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
    - Kiểm tra số dư ví
    - Trừ Trứng Cú từ ví
    - Sử dụng AI để chấm điểm theo tiêu chí chuẩn
    - Trả về điểm số và feedback chi tiết
    """
    try:
        logger.info(f"Grading speaking answer for question: {request.question_id}")
        
        # Deduct cost from wallet BEFORE grading
        payment_info = await deduct_ai_grading_cost(db, current_user.id, "speaking")
        
        # Grade with AI
        result = await chatgpt_service.grade_speaking_answer(
            question=request.question_text,
            transcript=request.transcript,
            exam_type=request.exam_type,
            criteria=request.criteria,
        )
        
        logger.info(f"Speaking graded successfully. Cost: {payment_info['cost']} OWL, New balance: {payment_info['new_balance']}")
        
        return GradingResponse(
            status="success",
            question_id=request.question_id,
            overall_band=result.get("overall_score", 0),
            criteria_scores=result.get("criteria_scores", {}),
            criteria_feedback=result.get("criteria_feedback", {}),
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            detailed_feedback=result.get("detailed_feedback", ""),
            suggestions=result.get("suggestions", []),
            band_justification=result.get("band_justification"),
            pronunciation_note=result.get("pronunciation_note"),
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like insufficient balance)
        raise
    except Exception as e:
        logger.error(f"Error grading speaking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade speaking: {str(e)}"
        )


@router.get("/ai-grading-cost/{skill_type}")
async def get_ai_grading_cost_endpoint(
    skill_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI grading cost for a skill type
    Returns the cost in OWL eggs and user's current balance
    """
    if skill_type not in ['writing', 'speaking']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skill_type phải là 'writing' hoặc 'speaking'"
        )
    
    try:
        # Get cost
        cost = await get_ai_grading_cost(db, skill_type)
        
        # Get user wallet
        result = await db.execute(
            select(UserWallet).where(UserWallet.user_id == current_user.id)
        )
        wallet = result.scalar_one_or_none()
        
        current_balance = wallet.balance if wallet else 0
        can_afford = current_balance >= cost
        
        return {
            "skill_type": skill_type,
            "cost": cost,
            "current_balance": current_balance,
            "can_afford": can_afford,
            "shortfall": max(0, cost - current_balance)
        }
        
    except Exception as e:
        logger.error(f"Error getting AI grading cost: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Có lỗi xảy ra: {str(e)}"
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
            
            total_score += result.get("overall_score", 0)  # Keep as is for internal calculation
        
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


class SaveAIGradingRequest(BaseModel):
    """Request to save AI grading result to database"""
    submission_id: int
    question_id: int
    ai_grading_result: Dict[str, Any]


@router.post("/save-ai-grading")
async def save_ai_grading(
    request: SaveAIGradingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save AI grading result to user_exam_answers.ai_feedback
    """
    try:
        # Find the answer record
        result = await db.execute(
            select(UserExamAnswer).where(
                UserExamAnswer.question_id == request.question_id,
                UserExamAnswer.submission_id == request.submission_id,
                UserExamAnswer.deleted_at.is_(None)
            )
        )
        answer = result.scalar_one_or_none()
        
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Answer not found"
            )
        
        # Save AI grading result as JSON
        answer.ai_feedback = json.dumps(request.ai_grading_result, ensure_ascii=False)
        answer.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(answer)
        
        logger.info(f"Saved AI grading for question {request.question_id}, submission {request.submission_id}")
        
        return {
            "status": "success",
            "message": "AI grading result saved successfully",
            "answer_id": answer.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving AI grading: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save AI grading: {str(e)}"
        )


class TranscriptionRequest(BaseModel):
    """Request for audio transcription"""
    audio_url: str  # URL to audio file on server
    language: str = "en"  # Language code


class TranscriptionResponse(BaseModel):
    """Response for audio transcription"""
    status: str
    transcript: str
    audio_url: str


@router.post("/transcribe-audio", response_model=TranscriptionResponse)
async def transcribe_audio(
    request: TranscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe audio file to text using OpenAI Whisper API
    
    This endpoint:
    - Takes audio URL from uploads directory
    - Uses Whisper API to transcribe audio to text
    - Returns transcript for AI grading
    """
    try:
        from pathlib import Path
        
        # Extract file path from URL
        # URL format: /uploads/audio/filename.webm
        audio_path = request.audio_url.lstrip('/')
        full_path = Path(audio_path)
        
        if not full_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Audio file not found: {request.audio_url}"
            )
        
        logger.info(f"Transcribing audio: {request.audio_url}")
        
        # Transcribe using Whisper API
        transcript = await chatgpt_service.transcribe_audio(
            audio_file_path=str(full_path),
            language=request.language
        )
        
        logger.info(f"Transcription complete. Length: {len(transcript)} characters")
        
        return TranscriptionResponse(
            status="success",
            transcript=transcript,
            audio_url=request.audio_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )
