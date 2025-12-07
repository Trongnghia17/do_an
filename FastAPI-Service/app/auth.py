from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from app.models.auth_models import User
from app.database import AsyncSessionLocal
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# JWT Settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Fetch user from SQLAlchemy DB
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()

    if user is None or getattr(user, "deleted_at", None) is not None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_optional_user(token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False))) -> Optional[User]:
    """Get current user from JWT token (optional - returns None if no token)"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    # Fetch user from SQLAlchemy DB
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()

    if user is None or getattr(user, "deleted_at", None) is not None:
        return None

    if not user.is_active:
        return None

    return user


# Permission system removed — keep role-based dependency only


def require_role(role_name: str):
    """Dependency to require specific role"""
    async def role_checker(current_user: User = Depends(get_current_user)):
        # current_user.role is relationship loaded lazily; compare by name
        role = getattr(current_user, "role", None)
        if not role or role.name != role_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {role_name}"
            )
        return current_user
    return role_checker
