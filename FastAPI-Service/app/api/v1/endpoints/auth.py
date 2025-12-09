from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta, datetime
from loguru import logger

from app.models.auth_models import User, LoginActivity
from app.auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db

router = APIRouter()


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    email: str
    phone: Optional[str]
    is_active: bool
    role_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register new user
    """
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password=User.hash_password(user_data.password),
        is_active=True,
        role_id=2,  # Student role
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"New user registered: {user.email}")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Get role name if role exists
    role_name = None
    if user.role:
        role_name = user.role.name
    
    return Token(
        access_token=access_token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,
            "role_id": user.role_id,
            "role": role_name,
        }
    )


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    """
    # Find user with role
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    # Verify password
    if not user or not user.verify_password(form_data.password):
        # Log failed login
        if user:
            failed_activity = LoginActivity(
                user_id=user.id,
                provider="email",
                ip=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                succeeded=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(failed_activity)
            await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Log successful login
    login_activity = LoginActivity(
        user_id=user.id,
        provider="email",
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        succeeded=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(login_activity)
    await db.commit()
    
    logger.info(f"User logged in: {user.email}")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Get role name if role exists
    role_name = None
    if user.role:
        role_name = user.role.name
    
    return Token(
        access_token=access_token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,
            "role_id": user.role_id,
            "role": role_name,
        }
    )


@router.post("/login/json", response_model=Token)
async def login_json(
    request: Request,
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with JSON payload (alternative to form data)
    """
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.email == login_data.email)
    )
    user = result.scalar_one_or_none()
    
    # Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user has password (OAuth users may not have password)
    if not user.password or user.password == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was created with Google login. Please login with Google or set a password first."
        )
    
    # Verify password
    if not user.verify_password(login_data.password):
        failed_activity = LoginActivity(
            user_id=user.id,
            provider="email",
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            succeeded=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(failed_activity)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    login_activity = LoginActivity(
        user_id=user.id,
        provider="email",
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        succeeded=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(login_activity)
    await db.commit()
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Get role name if role exists
    role_name = None
    if user.role:
        role_name = user.role.name
    
    return Token(
        access_token=access_token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,
            "role_id": user.role_id,
            "role": role_name,
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user info
    """
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout - log activity
    Note: JWT is stateless, client should remove token
    """
    logger.info(f"User logged out: {current_user.email}")
    
    return {"message": "Successfully logged out"}


@router.post("/refresh-token", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Refresh access token
    """
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        user={
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        }
    )


class SetPasswordRequest(BaseModel):
    password: str
    confirm_password: str


@router.post("/set-password")
async def set_password(
    request: SetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Set password for OAuth users who don't have password yet
    """
    # Validate passwords match
    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Validate password strength
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Update password
    current_user.password = User.hash_password(request.password)
    current_user.updated_at = datetime.utcnow()
    
    await db.commit()
    
    logger.info(f"Password set for user: {current_user.email}")
    
    return {
        "success": True,
        "message": "Password has been set successfully. You can now login with email and password."
    }


@router.get("/login-history")
async def get_login_history(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get login history for current user
    """
    if limit > 50:
        limit = 50
    
    result = await db.execute(
        select(LoginActivity)
        .where(LoginActivity.user_id == current_user.id)
        .order_by(LoginActivity.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    activities = result.scalars().all()
    
    return {
        "total": len(activities),
        "skip": skip,
        "limit": limit,
        "data": [
            {
                "id": activity.id,
                "provider": activity.provider,
                "ip": activity.ip,
                "user_agent": activity.user_agent,
                "succeeded": activity.succeeded,
                "created_at": activity.created_at,
            }
            for activity in activities
        ]
    }
