from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    """User model - simplified version"""

    id: str
    email: str
    name: str
    role: str = "student"
    is_active: bool = True


class UserCreate(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
