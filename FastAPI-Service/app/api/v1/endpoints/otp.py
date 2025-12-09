"""
OTP endpoints for user verification
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime, timedelta
import random
import string
from loguru import logger

from app.database import get_db
from app.models.auth_models import User
from app.services.email_service import email_service

router = APIRouter()

# In-memory OTP storage (for production, use Redis)
otp_storage = {}


class OTPSendRequest(BaseModel):
    channel: Literal["email", "zalo_oa"]
    destination: str  # email or phone
    email: EmailStr
    purpose: Literal["register", "reset_password"]


class OTPVerifyRequest(BaseModel):
    destination: str
    otp_code: str
    email: EmailStr
    password: str
    purpose: Literal["register", "reset_password"]


def generate_otp(length: int = 6) -> str:
    """Generate random OTP code"""
    return ''.join(random.choices(string.digits, k=length))


@router.post("/otp/send")
async def send_otp(
    request: OTPSendRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send OTP code via email or Zalo OA
    """
    try:
        # Check if user already exists (for register purpose)
        if request.purpose == "register":
            result = await db.execute(
                select(User).where(User.email == request.email)
            )
            existing_user = result.scalar_one_or_none()
            
            # Only reject if user exists AND has a password
            # Allow if user is OAuth account (no password) - they're setting password
            if existing_user and existing_user.password and existing_user.password != "":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email đã được đăng ký"
                )
        
        # Generate OTP
        otp_code = generate_otp()
        
        # Store OTP with expiration (5 minutes)
        otp_storage[request.destination] = {
            "code": otp_code,
            "expires_at": datetime.utcnow() + timedelta(minutes=5),
            "purpose": request.purpose,
            "email": request.email
        }
        
        # Send OTP based on channel
        if request.channel == "email":
            success = email_service.send_otp_email(request.destination, otp_code)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Không thể gửi email. Vui lòng thử lại sau."
                )
            
            logger.info(f"OTP sent to email: {request.destination}")
            return {
                "success": True,
                "message": "Mã OTP đã được gửi đến email của bạn"
            }
        
        elif request.channel == "zalo_oa":
            # TODO: Implement Zalo OA integration
            # For now, just log the OTP
            logger.info(f"OTP for {request.destination}: {otp_code} (Zalo OA not implemented)")
            return {
                "success": True,
                "message": "Tính năng gửi qua Zalo OA đang được phát triển. Vui lòng sử dụng Email."
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kênh gửi không hợp lệ"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending OTP: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi gửi OTP"
        )


@router.post("/otp/verify")
async def verify_otp(
    request: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP code and create user account (for register purpose)
    """
    try:
        # Check if OTP exists
        if request.destination not in otp_storage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP không tồn tại hoặc đã hết hạn"
            )
        
        stored_otp = otp_storage[request.destination]
        
        # Check if OTP is expired
        if datetime.utcnow() > stored_otp["expires_at"]:
            del otp_storage[request.destination]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP đã hết hạn"
            )
        
        # Verify OTP code
        if stored_otp["code"] != request.otp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã OTP không chính xác"
            )
        
        # Check purpose
        if stored_otp["purpose"] != request.purpose:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mục đích xác thực không khớp"
            )
        
        # If purpose is register, create or update user account
        if request.purpose == "register":
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == request.email)
            )
            existing_user = result.scalar_one_or_none()
            
            # If user exists with password, reject
            if existing_user and existing_user.password and existing_user.password != "":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email đã được đăng ký"
                )
            
            # If user exists but no password (OAuth user), update password
            if existing_user and (not existing_user.password or existing_user.password == ""):
                existing_user.password = User.hash_password(request.password)
                existing_user.email_verified_at = datetime.utcnow()
                existing_user.updated_at = datetime.utcnow()
                await db.commit()
                await db.refresh(existing_user)
                user = existing_user
                logger.info(f"Password set for OAuth user via OTP: {user.email}")
            else:
                # Create new user
                # Extract phone from destination if channel was phone
                phone = None
                if request.destination != request.email:
                    phone = request.destination
                
                user = User(
                    name=request.email.split('@')[0],  # Use email prefix as default name
                    email=request.email,
                    phone=phone,
                    password=User.hash_password(request.password),
                    is_active=True,
                    role_id=2,  # Student role
                    email_verified_at=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                
                db.add(user)
                await db.commit()
                await db.refresh(user)
                
                logger.info(f"New user created via OTP: {user.email}")
            
            # Clean up OTP
            del otp_storage[request.destination]
            
            # Import here to avoid circular import
            from app.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
            
            # Create access token
            access_token = create_access_token(
                data={"sub": str(user.id)},
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            
            return {
                "success": True,
                "message": "Xác thực thành công",
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "phone": user.phone,
                    "is_active": user.is_active
                }
            }
        
        # For other purposes, just verify OTP
        del otp_storage[request.destination]
        return {
            "success": True,
            "message": "Xác thực OTP thành công"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying OTP: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi xác thực OTP"
        )
