from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
import os
import uuid
from datetime import datetime
from pathlib import Path
from app.auth import get_current_user
from app.models.auth_models import User

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image file"""
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_IMAGE_SIZE / 1024 / 1024}MB"
        )
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{timestamp}_{unique_id}{file_ext}"
    
    # Save file
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return URL (adjust base_url as needed)
    file_url = f"/uploads/{filename}"
    
    return {
        "url": file_url,
        "filename": filename,
        "size": len(contents),
        "content_type": file.content_type
    }


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an audio file"""
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_AUDIO_SIZE / 1024 / 1024}MB"
        )
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{timestamp}_{unique_id}{file_ext}"
    
    # Save file
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return URL (adjust base_url as needed)
    file_url = f"/uploads/{filename}"
    
    return {
        "url": file_url,
        "filename": filename,
        "size": len(contents),
        "content_type": file.content_type
    }


@router.delete("/image")
async def delete_image(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an uploaded image"""
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete file
    os.remove(file_path)
    
    return {"message": "File deleted successfully"}


@router.delete("/audio")
async def delete_audio(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an uploaded audio"""
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete file
    os.remove(file_path)
    
    return {"message": "Audio file deleted successfully"}
