"""Job management endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.core.database import get_db
from app.core.security import get_current_user, require_operator, generate_id
from app.models import Job, JobStatus, Lease, Machine, Agent, Run, RunStatus, User, Event, Artifact
from app.schemas import (
    JobCreate, JobResponse, JobListResponse, JobActionRequest, 
    RunResponse, RunDetailResponse, EventResponse, ArtifactResponse
)
from app.services.scheduler import SchedulerService
from app.services.audit import log_audit_event
from app.services.storage import storage

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobResponse)
async def create_job(
    request: Request,
    job_data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Create a new job."""
    job = await SchedulerService.create_job(
        db,
        current_user.id,
        job_data.title,
        job_data.priority,
        job_data.routing.dict(),
        job_data.payload,
        job_data.max_retries
    )
    
    await log_audit_event(
        db, current_user.id, "create_job", "job", job.id,
        {"title": job_data.title},
        request.client.host
    )
    
    return job


@router.get("", response_model=JobListResponse)
async def list_jobs(
    status: Optional[JobStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List jobs with optional filtering."""
    query = select(Job)
    
    if status:
        query = query.where(Job.status == status)
    
    # Get total count
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Paginate
    query = query.order_by(desc(Job.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return JobListResponse(
        items=jobs,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific job."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.post("/{job_id}/action")
async def job_action(
    request: Request,
    job_id: str,
    action_req: JobActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator)
):
    """Perform an action on a job (cancel, retry, reassign)."""
    if action_req.action == "cancel":
        success = await SchedulerService.cancel_job(db, job_id)
        if not success:
            raise HTTPException(status_code=400, detail="Job cannot be cancelled")
        
        await log_audit_event(
            db, current_user.id, "cancel_job", "job", job_id,
            ip_address=request.client.host
        )
        return {"message": "Job cancelled"}
    
    elif action_req.action == "retry":
        job = await SchedulerService.retry_job(db, job_id)
        if not job:
            raise HTTPException(status_code=400, detail="Job cannot be retried")
        
        await log_audit_event(
            db, current_user.id, "retry_job", "job", job_id,
            ip_address=request.client.host
        )
        return job
    
    elif action_req.action == "reassign":
        # TODO: Implement reassign
        raise HTTPException(status_code=501, detail="Reassign not yet implemented")
    
    else:
        raise HTTPException(status_code=400, detail="Unknown action")


# ==================== Run Endpoints ====================

@router.get("/{job_id}/runs", response_model=list[RunResponse])
async def list_job_runs(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all runs for a job."""
    result = await db.execute(
        select(Run, Agent.name, Job.title)
        .join(Agent)
        .join(Job)
        .where(Run.job_id == job_id)
        .order_by(desc(Run.started_at))
    )
    
    runs = []
    for row in result.all():
        run = row[0]
        run.agent_name = row[1]
        run.job_title = row[2]
        if run.started_at and run.finished_at:
            run.duration_ms = int((run.finished_at - run.started_at).total_seconds() * 1000)
        runs.append(run)
    
    return runs


@router.get("/runs/{run_id}", response_model=RunDetailResponse)
async def get_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get run details with events and artifacts."""
    # Get run
    result = await db.execute(
        select(Run, Agent.name, Job.title)
        .join(Agent)
        .join(Job)
        .where(Run.id == run_id)
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run = row[0]
    run.agent_name = row[1]
    run.job_title = row[2]
    if run.started_at and run.finished_at:
        run.duration_ms = int((run.finished_at - run.started_at).total_seconds() * 1000)
    
    # Get events
    events_result = await db.execute(
        select(Event).where(Event.run_id == run_id).order_by(Event.ts)
    )
    run.events = events_result.scalars().all()
    
    # Get artifacts with download URLs
    artifacts_result = await db.execute(
        select(Artifact).where(Artifact.run_id == run_id)
    )
    artifacts = artifacts_result.scalars().all()
    
    for artifact in artifacts:
        # Generate presigned download URL
        key = artifact.storage_uri.replace(f"s3://{storage.bucket}/", "")
        artifact.download_url = storage.generate_presigned_download(key, expires=3600)
    
    run.artifacts = artifacts
    
    return run
