from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.config import settings
from app.database import connect_to_db, close_db_connection
from app.api.v1 import api_router


# Configure logger
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up OwlEnglish Service...")
    await connect_to_db()
    logger.info("Connected to MySQL database")
    
    yield
    
    # Shutdown
    logger.info("Shutting down OwlEnglish Service...")
    await close_db_connection()


app = FastAPI(
    title=settings.APP_NAME,
    description="Complete backend replacement for Laravel - Exam generation and grading with AI",
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# Session middleware for admin panel
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    max_age=3600 * 24,  # 24 hours
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (for uploads, etc.)
# app.mount("/static", StaticFiles(directory="storage/public"), name="static")

# Include API routes
app.include_router(api_router, prefix=f"/api/{settings.API_VERSION}")


@app.get("/")
async def root():
    return {
        "message": "OwlEnglish Backend Service",
        "version": settings.API_VERSION,
        "status": "running",
        "description": "FastAPI-based backend replacing Laravel",
        "features": [
            "User Authentication & Authorization",
            "Exam Management (CRUD)",
            "AI Question Generation",
            "AI Grading (Writing, Speaking)",
        ]
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
