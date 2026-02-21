"""Audit logging service."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog
from app.core.security import generate_id


async def log_audit_event(
    db: AsyncSession,
    user_id: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: dict = None,
    ip_address: Optional[str] = None
):
    """Log an audit event."""
    audit = AuditLog(
        id=generate_id(),
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address
    )
    db.add(audit)
    await db.commit()
