"""Runner token management endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, require_admin, generate_id, generate_runner_token
from app.models import RunnerToken, User
from app.schemas import RunnerTokenCreate, RunnerTokenResponse
from app.services.audit import log_audit_event

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.post("", response_model=RunnerTokenResponse)
async def create_token(
    request: Request,
    token_data: RunnerTokenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new runner token."""
    token, token_hash = generate_runner_token()
    
    runner_token = RunnerToken(
        id=generate_id(),
        token_hash=token_hash,
        description=token_data.description,
        created_by=current_user.id
    )
    db.add(runner_token)
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "create_runner_token", "runner_token", runner_token.id,
        ip_address=request.client.host
    )
    
    # Return token only once
    response = RunnerTokenResponse.from_orm(runner_token)
    response.token = token
    return response


@router.get("", response_model=list[RunnerTokenResponse])
async def list_tokens(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all runner tokens."""
    result = await db.execute(select(RunnerToken).order_by(RunnerToken.created_at.desc()))
    return result.scalars().all()


@router.post("/{token_id}/revoke")
async def revoke_token(
    request: Request,
    token_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Revoke a runner token."""
    result = await db.execute(select(RunnerToken).where(RunnerToken.id == token_id))
    token = result.scalar_one_or_none()
    
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if token.revoked_at:
        raise HTTPException(status_code=400, detail="Token already revoked")
    
    token.revoked_at = datetime.utcnow()
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "revoke_runner_token", "runner_token", token_id,
        ip_address=request.client.host
    )
    
    return {"message": "Token revoked"}
