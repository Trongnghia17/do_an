from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.auth_models import User
from app.models.payment_models import PaymentPackage
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()


# ==================== Schemas ====================

class PaymentPackageBase(BaseModel):
    amount: int
    owl_amount: int
    bonus_owl: int = 0
    label: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class PaymentPackageCreate(PaymentPackageBase):
    pass


class PaymentPackageUpdate(BaseModel):
    amount: Optional[int] = None
    owl_amount: Optional[int] = None
    bonus_owl: Optional[int] = None
    label: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class PaymentPackageResponse(PaymentPackageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Helper Functions ====================

async def verify_admin(current_user: User):
    """Verify that current user is admin"""
    # Assuming role_id = 1 is admin, adjust based on your roles
    if not current_user.role_id or current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới có quyền truy cập"
        )
    return current_user


# ==================== Endpoints ====================

@router.get("/", response_model=List[PaymentPackageResponse])
async def list_payment_packages(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all payment packages (Admin only)
    """
    await verify_admin(current_user)
    
    query = select(PaymentPackage)
    
    if not include_inactive:
        query = query.where(PaymentPackage.is_active == True)
    
    query = query.order_by(PaymentPackage.display_order, PaymentPackage.amount)
    
    result = await db.execute(query)
    packages = result.scalars().all()
    
    return packages


@router.get("/{package_id}", response_model=PaymentPackageResponse)
async def get_payment_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific payment package (Admin only)
    """
    await verify_admin(current_user)
    
    result = await db.execute(
        select(PaymentPackage).where(PaymentPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy gói nạp"
        )
    
    return package


@router.post("/", response_model=PaymentPackageResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_package(
    package_data: PaymentPackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new payment package (Admin only)
    """
    await verify_admin(current_user)
    
    # Validate amount
    if package_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số tiền phải lớn hơn 0"
        )
    
    if package_data.owl_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số Trứng Cú phải lớn hơn 0"
        )
    
    # Create package
    package = PaymentPackage(**package_data.model_dump())
    db.add(package)
    await db.commit()
    await db.refresh(package)
    
    return package


@router.put("/{package_id}", response_model=PaymentPackageResponse)
async def update_payment_package(
    package_id: int,
    package_data: PaymentPackageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a payment package (Admin only)
    """
    await verify_admin(current_user)
    
    # Get existing package
    result = await db.execute(
        select(PaymentPackage).where(PaymentPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy gói nạp"
        )
    
    # Update fields
    update_data = package_data.model_dump(exclude_unset=True)
    
    # Validate if amount or owl_amount is being updated
    if "amount" in update_data and update_data["amount"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số tiền phải lớn hơn 0"
        )
    
    if "owl_amount" in update_data and update_data["owl_amount"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số Trứng Cú phải lớn hơn 0"
        )
    
    for field, value in update_data.items():
        setattr(package, field, value)
    
    await db.commit()
    await db.refresh(package)
    
    return package


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a payment package (Admin only)
    """
    await verify_admin(current_user)
    
    result = await db.execute(
        select(PaymentPackage).where(PaymentPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy gói nạp"
        )
    
    await db.delete(package)
    await db.commit()
    
    return None
