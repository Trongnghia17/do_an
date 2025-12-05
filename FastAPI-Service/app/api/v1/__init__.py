from fastapi import APIRouter
from app.api.v1.endpoints import auth, exams, users, questions, generation, grading

api_router = APIRouter()

# Authentication routes (SQLAlchemy - ✅ Ready!)
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Exam management (SQLAlchemy - ✅ Ready!)
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])

# User management (SQLAlchemy - ✅ Ready!)
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Question management (SQLAlchemy - ✅ Ready!)
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])

# AI Generation with ChatGPT (✅ Ready!)
api_router.include_router(generation.router, prefix="/generation", tags=["AI Generation"])

# AI Grading with ChatGPT (✅ Ready!)
api_router.include_router(grading.router, prefix="/grading", tags=["AI Grading"])
