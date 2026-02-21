"""Job scheduling and state machine service."""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.models import Job, JobStatus, Lease, Machine, Agent, Run, RunStatus
from app.core.config import settings
from app.core.security import generate_id
from app.core import redis
from app.schemas import JobRouting


class SchedulerService:
    """Job scheduling and routing service."""
    
    @staticmethod
    async def create_job(
        db: AsyncSession,
        user_id: str,
        title: str,
        priority: int,
        routing: dict,
        payload: dict,
        max_retries: int
    ) -> Job:
        """Create a new job and enqueue it."""
        job = Job(
            id=generate_id(),
            created_by=user_id,
            title=title,
            priority=priority,
            routing=routing,
            payload=payload,
            status=JobStatus.QUEUED,
            retries=0,
            max_retries=max_retries
        )
        db.add(job)
        await db.commit()
        
        # Enqueue in Redis
        await redis.enqueue_job(job.id, priority)
        
        return job
    
    @staticmethod
    async def find_matching_agent(
        db: AsyncSession,
        routing: JobRouting
    ) -> Optional[tuple[Agent, Machine]]:
        """Find an agent that matches the routing requirements."""
        # Build query for agents
        query = select(Agent, Machine).join(Machine).where(
            and_(
                Machine.status == 'online',
                Agent.status.in_(['idle', 'busy'])  # Can accept if under concurrency
            )
        )
        
        # Filter by required tags
        if routing.required_tags:
            for tag in routing.required_tags:
                query = query.where(Agent.tags.contains([tag]))
        
        # Filter by preferred agents
        if routing.preferred_agents:
            query = query.where(
                or_(
                    Agent.id.in_(routing.preferred_agents),
                    Agent.name.in_(routing.preferred_agents)
                )
            )
        
        # Filter by preferred machines
        if routing.preferred_machines:
            query = query.where(
                or_(
                    Machine.id.in_(routing.preferred_machines),
                    Machine.hostname.in_(routing.preferred_machines)
                )
            )
        
        # Order by load (fewer current runs = higher priority)
        query = query.order_by(func.coalesce(Agent.max_concurrency, 1) - func.count(Agent.current_run_id))
        
        result = await db.execute(query)
        agents = result.all()
        
        for agent, machine in agents:
            # Check concurrency
            current_runs_count = await db.execute(
                select(func.count(Run.id)).where(
                    and_(
                        Run.agent_id == agent.id,
                        Run.status == RunStatus.RUNNING
                    )
                )
            )
            count = current_runs_count.scalar()
            
            if count < agent.max_concurrency:
                return agent, machine
        
        return None, None
    
    @staticmethod
    async def lease_job(
        db: AsyncSession,
        job_id: str,
        machine_id: str,
        agent_id: str
    ) -> Optional[Lease]:
        """Create a lease for a job."""
        # Check if job is still queued
        result = await db.execute(
            select(Job).where(
                and_(Job.id == job_id, Job.status == JobStatus.QUEUED)
            )
        )
        job = result.scalar_one_or_none()
        
        if not job:
            return None
        
        # Create lease
        lease = Lease(
            id=generate_id(),
            job_id=job_id,
            machine_id=machine_id,
            agent_id=agent_id,
            lease_expires_at=datetime.utcnow() + timedelta(seconds=settings.lease_ttl_seconds),
            status=JobStatus.LEASED
        )
        
        # Update job status
        job.status = JobStatus.LEASED
        
        db.add(lease)
        await db.commit()
        
        # Remove from queue
        await redis.remove_job_from_queue(job_id)
        
        return lease
    
    @staticmethod
    async def renew_lease(db: AsyncSession, lease_id: str) -> Optional[Lease]:
        """Renew a lease."""
        result = await db.execute(select(Lease).where(Lease.id == lease_id))
        lease = result.scalar_one_or_none()
        
        if not lease:
            return None
        
        lease.lease_expires_at = datetime.utcnow() + timedelta(seconds=settings.lease_ttl_seconds)
        lease.renewed_at = datetime.utcnow()
        
        await db.commit()
        return lease
    
    @staticmethod
    async def expire_leases(db: AsyncSession):
        """Expire stale leases and requeue jobs."""
        now = datetime.utcnow()
        
        result = await db.execute(
            select(Lease).where(Lease.lease_expires_at < now)
        )
        expired_leases = result.scalars().all()
        
        for lease in expired_leases:
            # Get the job
            result = await db.execute(select(Job).where(Job.id == lease.job_id))
            job = result.scalar_one()
            
            # Increment retries
            job.retries += 1
            
            if job.retries >= job.max_retries:
                job.status = JobStatus.FAILED
            else:
                job.status = JobStatus.QUEUED
                await redis.enqueue_job(job.id, job.priority)
            
            # Delete lease
            await db.delete(lease)
        
        await db.commit()
    
    @staticmethod
    async def cancel_job(db: AsyncSession, job_id: str) -> bool:
        """Cancel a job."""
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            return False
        
        if job.status in [JobStatus.SUCCEEDED, JobStatus.FAILED, JobStatus.CANCELLED]:
            return False
        
        job.status = JobStatus.CANCELLED
        
        # Remove from queue if still queued
        if job.status == JobStatus.QUEUED:
            await redis.remove_job_from_queue(job_id)
        
        # If leased, delete lease
        result = await db.execute(select(Lease).where(Lease.job_id == job_id))
        lease = result.scalar_one_or_none()
        if lease:
            await db.delete(lease)
        
        await db.commit()
        return True
    
    @staticmethod
    async def retry_job(db: AsyncSession, job_id: str) -> Optional[Job]:
        """Retry a failed job."""
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job or job.status not in [JobStatus.FAILED, JobStatus.CANCELLED]:
            return None
        
        job.status = JobStatus.QUEUED
        job.retries = 0
        job.updated_at = datetime.utcnow()
        
        await db.commit()
        await redis.enqueue_job(job.id, job.priority)
        
        return job
