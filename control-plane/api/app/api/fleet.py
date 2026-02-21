"""Fleet management endpoints (machines and agents)."""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user, require_admin
from app.models import Machine, Agent, MachineStatus, AgentStatus, User
from app.schemas import (
    MachineResponse, AgentResponse, AgentUpdate
)
from app.services.audit import log_audit_event
from app.core import redis

router = APIRouter(prefix="/fleet", tags=["fleet"])


@router.get("/machines", response_model=list[MachineResponse])
async def list_machines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all machines in the fleet."""
    result = await db.execute(
        select(Machine, func.count(Agent.id).label("agent_count"))
        .outerjoin(Agent)
        .group_by(Machine.id)
    )
    
    machines = []
    for row in result.all():
        machine = row[0]
        machine.agent_count = row[1]
        machines.append(machine)
    
    return machines


@router.get("/machines/{machine_id}", response_model=MachineResponse)
async def get_machine(
    machine_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific machine."""
    result = await db.execute(
        select(Machine, func.count(Agent.id).label("agent_count"))
        .outerjoin(Agent)
        .where(Machine.id == machine_id)
        .group_by(Machine.id)
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    machine = row[0]
    machine.agent_count = row[1]
    return machine


@router.get("/agents", response_model=list[AgentResponse])
async def list_agents(
    machine_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all agents."""
    query = select(Agent, Machine.hostname).join(Machine)
    
    if machine_id:
        query = query.where(Agent.machine_id == machine_id)
    
    result = await db.execute(query)
    
    agents = []
    for row in result.all():
        agent = row[0]
        agent.machine_hostname = row[1]
        agents.append(agent)
    
    return agents


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific agent."""
    result = await db.execute(
        select(Agent, Machine.hostname)
        .join(Machine)
        .where(Agent.id == agent_id)
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = row[0]
    agent.machine_hostname = row[1]
    return agent


@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    request: Request,
    agent_id: str,
    update_data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update an agent configuration."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if update_data.name:
        agent.name = update_data.name
    if update_data.model:
        agent.model = update_data.model
    if update_data.tags is not None:
        agent.tags = update_data.tags
    if update_data.tools is not None:
        agent.tools = update_data.tools
    if update_data.max_concurrency is not None:
        agent.max_concurrency = update_data.max_concurrency
    
    agent.updated_at = datetime.utcnow()
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "update_agent", "agent", agent_id,
        update_data.dict(exclude_unset=True),
        request.client.host
    )
    
    return agent


@router.post("/machines/{machine_id}/offline")
async def mark_machine_offline(
    request: Request,
    machine_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Manually mark a machine as offline."""
    result = await db.execute(select(Machine).where(Machine.id == machine_id))
    machine = result.scalar_one_or_none()
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    machine.status = MachineStatus.OFFLINE
    await db.commit()
    
    await log_audit_event(
        db, current_user.id, "mark_offline", "machine", machine_id,
        ip_address=request.client.host
    )
    
    return {"message": "Machine marked offline"}
