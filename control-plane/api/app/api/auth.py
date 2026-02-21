"""Authentication endpoints."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password, create_access_token, get_password_hash, 
    generate_id, get_current_user
)
from app.models import User, UserRole
from app.schemas import LoginRequest, Token, UserCreate, UserResponse, UserUpdate
from app.services.audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate and get access token."""
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Log audit
    await log_audit_event(
        db, user.id, "login", "user", user.id,
        ip_address=request.client.host
    )
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return current_user


@router.post("/users", response_model=UserResponse)
async def create_user(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user. Only Owner and Admin can create users."""
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Only Owner can create Owner
    if user_data.role == UserRole.OWNER and current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only Owner can create Owner users")
    
    user = User(
        id=generate_id(),
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    db.add(user)
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "create_user", "user", user.id,
        {"email": user_data.email, "role": user_data.role.value},
        request.client.host
    )
    
    return user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users."""
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(User))
    return result.scalars().all()


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    request: Request,
    user_id: str,
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a user."""
    # Users can update themselves, Owners/Admins can update anyone
    if current_user.id != user_id and current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only Owner can change roles to/from Owner
    if update_data.role:
        if update_data.role == UserRole.OWNER and current_user.role != UserRole.OWNER:
            raise HTTPException(status_code=403, detail="Only Owner can assign Owner role")
        if user.role == UserRole.OWNER and current_user.role != UserRole.OWNER:
            raise HTTPException(status_code=403, detail="Only Owner can modify Owner users")
        user.role = update_data.role
    
    if update_data.email:
        user.email = update_data.email
    
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "update_user", "user", user_id,
        update_data.dict(exclude_unset=True),
        request.client.host
    )
    
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user. Only Owner can delete users."""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only Owner can delete users")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "delete_user", "user", user_id,
        ip_address=request.client.host
    )
    
    return {"message": "User deleted"}


from datetime import datetime
