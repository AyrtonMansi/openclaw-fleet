"""Tests for job state machine and leasing."""

import pytest
from datetime import datetime, timedelta

from app.services.scheduler import SchedulerService
from app.models import Job, JobStatus, Lease, Run, RunStatus


@pytest.mark.asyncio
async def test_create_job(db_session):
    """Test job creation."""
    job = await SchedulerService.create_job(
        db_session,
        user_id="test-user",
        title="Test Job",
        priority=1,
        routing={},
        payload={"test": "data"},
        max_retries=3
    )
    
    assert job.title == "Test Job"
    assert job.status == JobStatus.QUEUED
    assert job.priority == 1


@pytest.mark.asyncio
async def test_lease_job(db_session):
    """Test job leasing."""
    # Create job
    job = await SchedulerService.create_job(
        db_session,
        user_id="test-user",
        title="Test Job",
        priority=5,
        routing={},
        payload={},
        max_retries=3
    )
    
    # Lease it
    lease = await SchedulerService.lease_job(
        db_session,
        job_id=job.id,
        machine_id="test-machine",
        agent_id="test-agent"
    )
    
    assert lease is not None
    assert lease.job_id == job.id
    assert lease.machine_id == "test-machine"
    
    # Check job status updated
    await db_session.refresh(job)
    assert job.status == JobStatus.LEASED


@pytest.mark.asyncio
async def test_lease_expiry_requeue(db_session):
    """Test that expired leases requeue jobs."""
    # Create job
    job = await SchedulerService.create_job(
        db_session,
        user_id="test-user",
        title="Test Job",
        priority=5,
        routing={},
        payload={},
        max_retries=3
    )
    
    # Lease it with expired time
    lease = await SchedulerService.lease_job(
        db_session,
        job_id=job.id,
        machine_id="test-machine",
        agent_id="test-agent"
    )
    
    # Manually expire the lease
    lease.lease_expires_at = datetime.utcnow() - timedelta(seconds=1)
    await db_session.commit()
    
    # Run expiry check
    await SchedulerService.expire_leases(db_session)
    
    # Check job is back to queued
    await db_session.refresh(job)
    assert job.status == JobStatus.QUEUED
    assert job.retries == 1


@pytest.mark.asyncio
async def test_cancel_job(db_session):
    """Test job cancellation."""
    job = await SchedulerService.create_job(
        db_session,
        user_id="test-user",
        title="Test Job",
        priority=5,
        routing={},
        payload={},
        max_retries=3
    )
    
    success = await SchedulerService.cancel_job(db_session, job.id)
    assert success is True
    
    await db_session.refresh(job)
    assert job.status == JobStatus.CANCELLED


@pytest.mark.asyncio
async def test_retry_job(db_session):
    """Test job retry."""
    job = await SchedulerService.create_job(
        db_session,
        user_id="test-user",
        title="Test Job",
        priority=5,
        routing={},
        payload={},
        max_retries=3
    )
    
    # Mark as failed
    job.status = JobStatus.FAILED
    job.retries = 1
    await db_session.commit()
    
    # Retry
    retried_job = await SchedulerService.retry_job(db_session, job.id)
    assert retried_job is not None
    assert retried_job.status == JobStatus.QUEUED
    assert retried_job.retries == 0
