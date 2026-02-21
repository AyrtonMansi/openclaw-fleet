"""Runner API endpoints for daemon communication."""

import hashlib
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_runner_token, generate_id, redact_secrets
from app.core import redis
from app.models import (
    Machine, MachineStatus, Agent, AgentStatus, RunnerToken,
    Job, JobStatus, Lease, Run, RunStatus, Event, Artifact
)
from app.schemas import (
    RunnerRegisterRequest, RunnerRegisterResponse,
    RunnerPollRequest, RunnerPollResponse, RunnerJobOffer,
    RunnerLeaseRequest, RunnerLeaseResponse,
    RunnerLeaseRenewRequest, RunnerJobCompleteRequest,
    RunnerEventBatch, EventCreate,
    ArtifactInitRequest, ArtifactInitResponse, ArtifactCommitRequest
)
from app.services.scheduler import SchedulerService
from app.services.storage import storage

router = APIRouter(prefix="/runner", tags=["runner"])


def hash_token(token: str) -> str:
    """Hash a token for DB lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=RunnerRegisterResponse)
async def runner_register(
    request: Request,
    reg_data: RunnerRegisterRequest,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Register a new machine and its agents."""
    # Validate token
    token_hash = hash_token(x_runner_token)
    
    result = await db.execute(
        select(RunnerToken).where(
            and_(
                RunnerToken.token_hash == token_hash,
                RunnerToken.revoked_at.is_(None)
            )
        )
    )
    token = result.scalar_one_or_none()
    
    if not token:
        raise HTTPException(status_code=401, detail="Invalid runner token")
    
    # Create or update machine
    if token.machine_id:
        result = await db.execute(select(Machine).where(Machine.id == token.machine_id))
        machine = result.scalar_one_or_none()
    else:
        machine = None
    
    if not machine:
        machine = Machine(
            id=generate_id(),
            hostname=reg_data.hostname,
            os=reg_data.os,
            arch=reg_data.arch,
            labels=reg_data.labels,
            runner_version=reg_data.runner_version,
            status=MachineStatus.ONLINE
        )
        db.add(machine)
        token.machine_id = machine.id
    else:
        machine.hostname = reg_data.hostname
        machine.os = reg_data.os
        machine.arch = reg_data.arch
        machine.labels = reg_data.labels
        machine.runner_version = reg_data.runner_version
        machine.status = MachineStatus.ONLINE
    
    machine.last_seen = datetime.utcnow()
    await db.commit()
    
    # Register/update agents
    for agent_def in reg_data.agents:
        result = await db.execute(
            select(Agent).where(
                and_(Agent.machine_id == machine.id, Agent.name == agent_def.name)
            )
        )
        agent = result.scalar_one_or_none()
        
        if not agent:
            agent = Agent(
                id=generate_id(),
                machine_id=machine.id,
                name=agent_def.name,
                model=agent_def.model,
                tags=agent_def.tags,
                tools=agent_def.tools,
                max_concurrency=agent_def.max_concurrency,
                status=AgentStatus.IDLE
            )
            db.add(agent)
        else:
            agent.model = agent_def.model
            agent.tags = agent_def.tags
            agent.tools = agent_def.tools
            agent.max_concurrency = agent_def.max_concurrency
            agent.status = AgentStatus.IDLE
    
    await db.commit()
    
    return RunnerRegisterResponse(
        machine_id=machine.id,
        heartbeat_interval=settings.runner_heartbeat_interval
    )


@router.post("/heartbeat")
async def runner_heartbeat(
    request: Request,
    machine_id: str,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Receive heartbeat from runner."""
    result = await db.execute(select(Machine).where(Machine.id == machine_id))
    machine = result.scalar_one_or_none()
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    machine.last_seen = datetime.utcnow()
    machine.status = MachineStatus.ONLINE
    await db.commit()
    
    # Update Redis heartbeat
    await redis.update_runner_heartbeat(machine_id, {
        "ts": datetime.utcnow().isoformat(),
        "ip": request.client.host
    })
    
    return {"status": "ok"}


@router.post("/poll", response_model=RunnerPollResponse)
async def runner_poll(
    poll_data: RunnerPollRequest,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Poll for available jobs."""
    # Update agent statuses
    for agent_id, status in poll_data.agent_statuses.items():
        result = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if agent:
            agent.status = AgentStatus(status)
    
    await db.commit()
    
    # Find matching jobs
    # Get next job from queue
    job_id = await redis.dequeue_job()
    
    offers = []
    if job_id:
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if job and job.status == JobStatus.QUEUED:
            # Find matching agent on this machine
            result = await db.execute(
                select(Agent).where(
                    and_(
                        Agent.machine_id == poll_data.machine_id,
                        Agent.status.in_([AgentStatus.IDLE, AgentStatus.BUSY])
                    )
                )
            )
            agents = result.scalars().all()
            
            for agent in agents:
                # Check tags match
                required_tags = job.routing.get("required_tags", [])
                if all(tag in agent.tags for tag in required_tags):
                    # Check concurrency
                    result = await db.execute(
                        select(Run).where(
                            and_(
                                Run.agent_id == agent.id,
                                Run.status == RunStatus.RUNNING
                            )
                        )
                    )
                    running_count = len(result.scalars().all())
                    
                    if running_count < agent.max_concurrency:
                        offers.append(RunnerJobOffer(
                            job_id=job.id,
                            title=job.title,
                            payload=job.payload,
                            agent_id=agent.id
                        ))
                        break  # Only offer one job per poll
        else:
            # Job not available, put back
            if job:
                await redis.enqueue_job(job_id, job.priority)
    
    return RunnerPollResponse(jobs=offers)


@router.post("/lease", response_model=RunnerLeaseResponse)
async def runner_lease(
    lease_req: RunnerLeaseRequest,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Lease a job for execution."""
    lease = await SchedulerService.lease_job(
        db, lease_req.job_id, lease_req.machine_id, lease_req.agent_id
    )
    
    if not lease:
        raise HTTPException(status_code=409, detail="Job not available for lease")
    
    # Create run
    run = Run(
        id=generate_id(),
        job_id=lease_req.job_id,
        agent_id=lease_req.agent_id,
        status=RunStatus.PENDING,
        started_at=None,
        finished_at=None,
        summary={}
    )
    db.add(run)
    
    # Update agent current run
    result = await db.execute(select(Agent).where(Agent.id == lease_req.agent_id))
    agent = result.scalar_one()
    agent.current_run_id = run.id
    agent.status = AgentStatus.BUSY
    
    await db.commit()
    
    return RunnerLeaseResponse(
        lease_id=lease.id,
        lease_expires_at=lease.lease_expires_at,
        run_id=run.id,
        renew_interval=settings.lease_renew_interval
    )


@router.post("/lease/renew")
async def runner_lease_renew(
    renew_req: RunnerLeaseRenewRequest,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Renew a lease."""
    lease = await SchedulerService.renew_lease(db, renew_req.lease_id)
    
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    return {
        "lease_expires_at": lease.lease_expires_at,
        "renew_interval": settings.lease_renew_interval
    }


@router.post("/events")
async def runner_events(
    batch: RunnerEventBatch,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Receive batched events from runner."""
    result = await db.execute(select(Run).where(Run.id == batch.run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    for event_data in batch.events:
        # Redact secrets from event data
        safe_data = {k: redact_secrets(str(v)) if isinstance(v, str) else v 
                     for k, v in event_data.data.items()}
        
        event = Event(
            id=generate_id(),
            run_id=batch.run_id,
            ts=event_data.ts or datetime.utcnow(),
            type=event_data.type,
            data=safe_data
        )
        db.add(event)
        
        # Update run status on start/finish
        if event_data.type == "run_started":
            run.status = RunStatus.RUNNING
            run.started_at = datetime.utcnow()
        elif event_data.type == "run_finished":
            run.finished_at = datetime.utcnow()
    
    await db.commit()
    
    return {"received": len(batch.events)}


@router.post("/job/complete")
async def runner_job_complete(
    complete_req: RunnerJobCompleteRequest,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Mark a job as complete."""
    result = await db.execute(select(Run).where(Run.id == complete_req.run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run.status = RunStatus(complete_req.status)
    run.finished_at = datetime.utcnow()
    run.summary = complete_req.summary
    
    # Update job status
    result = await db.execute(select(Job).where(Job.id == run.job_id))
    job = result.scalar_one()
    job.status = JobStatus(complete_req.status)
    
    # Update agent
    result = await db.execute(select(Agent).where(Agent.id == run.agent_id))
    agent = result.scalar_one()
    agent.current_run_id = None
    agent.status = AgentStatus.IDLE
    
    # Delete lease
    result = await db.execute(select(Lease).where(Lease.job_id == run.job_id))
    lease = result.scalar_one_or_none()
    if lease:
        await db.delete(lease)
    
    await db.commit()
    
    return {"status": "ok"}


@router.post("/artifact/init", response_model=ArtifactInitResponse)
async def artifact_init(
    init_req: ArtifactInitRequest,
    run_id: str,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Initialize artifact upload and return presigned URL."""
    # Verify run exists
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Create artifact record
    artifact_id = generate_id()
    key = f"runs/{run_id}/{artifact_id}/{init_req.name}"
    
    artifact = Artifact(
        id=artifact_id,
        run_id=run_id,
        name=init_req.name,
        storage_uri=f"s3://{storage.bucket}/{key}",
        checksum=init_req.checksum,
        size=init_req.size,
        mime_type=init_req.mime_type
    )
    db.add(artifact)
    await db.commit()
    
    # Generate presigned upload URL
    upload_url = storage.generate_presigned_upload(
        key, content_type=init_req.mime_type
    )
    
    return ArtifactInitResponse(
        artifact_id=artifact_id,
        upload_url=upload_url
    )


@router.post("/artifact/commit")
async def artifact_commit(
    commit_req: ArtifactCommitRequest,
    x_runner_token: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Commit artifact after upload."""
    result = await db.execute(select(Artifact).where(Artifact.id == commit_req.artifact_id))
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    artifact.checksum = commit_req.checksum
    await db.commit()
    
    return {"status": "ok"}
