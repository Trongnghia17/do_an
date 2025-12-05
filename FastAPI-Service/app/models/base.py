"""
Base models and utilities for SQLAlchemy
MongoDB-related code removed - now using MySQL with SQLAlchemy
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = True
    message: Optional[str] = None


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at: datetime
    updated_at: datetime
