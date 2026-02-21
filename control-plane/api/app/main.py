"""OpenClaw Fleet API - Main Application."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import close_redis
from app.api import api_router
from app.services.scheduler import SchedulerService


async def lease_reaper_task():
    """Background task to expire stale leases."""
    from app.core.database import AsyncSessionLocal
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await SchedulerService.expire_leases(db)
        except Exception as e:
            print(f"Lease reaper error: {e}")
        
        await asyncio.sleep(30)  # Check every 30 seconds


async def machine_offline_task():
    """Background task to mark machines offline."""
    from datetime import datetime, timedelta
    from sqlalchemy import select, update
    from app.core.database import AsyncSessionLocal
    from app.models import Machine, MachineStatus
    from app.core.config import settings
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                cutoff = datetime.utcnow() - timedelta(seconds=settings.runner_heartbeat_timeout)
                
                await db.execute(
                    update(Machine)
                    .where(Machine.last_seen < cutoff)
                    .where(Machine.status != MachineStatus.OFFLINE)
                    .values(status=MachineStatus.OFFLINE)
                )
                await db.commit()
        except Exception as e:
            print(f"Machine offline task error: {e}")
        
        await asyncio.sleep(60)  # Check every minute


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    # Create tables (in production, use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start background tasks
    tasks = [
        asyncio.create_task(lease_reaper_task()),
        asyncio.create_task(machine_offline_task()),
    ]
    
    yield
    
    # Shutdown
    for task in tasks:
        task.cancel()
    
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.app_version}


@app.get("/")
async def root():
    """API root."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs"
    }
