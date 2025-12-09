"""
OAuth endpoints for Google login
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Optional
import httpx
from loguru import logger

from app.database import get_db
from app.models.auth_models import User, LoginActivity
from app.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.config import settings

router = APIRouter()


@router.get("/oauth/google/redirect")
async def google_redirect():
    """
    Redirect to Google OAuth login page
    """
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/oauth/google/callback")
async def google_callback(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Google OAuth callback
    """
    try:
        # Exchange authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Google token exchange failed: {token_response.text}")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_APP_URL}/login?error=oauth_failed"
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info from Google
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_info_response.status_code != 200:
                logger.error(f"Google user info failed: {user_info_response.text}")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_APP_URL}/login?error=oauth_failed"
                )
            
            user_info = user_info_response.json()
        
        # Extract user information
        email = user_info.get("email")
        name = user_info.get("name")
        google_id = user_info.get("id")
        picture = user_info.get("picture")
        
        if not email:
            logger.error("No email in Google user info")
            return RedirectResponse(
                url=f"{settings.FRONTEND_APP_URL}/login?error=no_email"
            )
        
        # Check if user exists
        result = await db.execute(
            select(User).options(selectinload(User.role)).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        # Track if this is a new user
        is_new_user = False
        
        # Create new user if doesn't exist, or update existing user
        if not user:
            user = User(
                name=name or email.split('@')[0],
                email=email,
                password="",  # No password for OAuth users (can be set later)
                is_active=True,
                role_id=2,  # Student role
                email_verified_at=datetime.utcnow(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            is_new_user = True
            logger.info(f"New user created via Google OAuth: {email}")
        else:
            # Update email verification for existing users
            if not user.email_verified_at:
                user.email_verified_at = datetime.utcnow()
                user.updated_at = datetime.utcnow()
                await db.commit()
                await db.refresh(user)
            logger.info(f"Existing user logged in via Google OAuth: {email}")
        
        # Record login activity
        login_activity = LoginActivity(
            user_id=user.id,
            provider="google",
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            succeeded=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(login_activity)
        await db.commit()
        
        # Create JWT token
        jwt_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Get role name if role exists
        role_name = None
        if user.role:
            role_name = user.role.name
        
        # Redirect to frontend with token
        redirect_url = (
            f"{settings.FRONTEND_APP_URL}/oauth/callback?"
            f"token={jwt_token}&"
            f"user_id={user.id}&"
            f"user_name={user.name}&"
            f"user_email={user.email}&"
            f"role_id={user.role_id or ''}&"
            f"role={role_name or ''}&"
            f"is_new_user={str(is_new_user).lower()}"
        )
        
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_APP_URL}/login?error=oauth_error"
        )
