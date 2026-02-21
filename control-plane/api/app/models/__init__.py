"""SQLAlchemy models for OpenClaw Fleet."""

import enum
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, Text, Boolean, 
    JSON, Enum, Index, BigInteger, ARRAY, Float
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class MachineStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class AgentStatus(str, enum.Enum):
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    LEASED = "leased"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RunStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class EventType(str, enum.Enum):
    RUN_STARTED = "run_started"
    STDOUT = "stdout"
    STDERR = "stderr"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    ERROR = "error"
    HEARTBEAT = "heartbeat"
    ARTIFACT_UPLOADED = "artifact_uploaded"
    RUN_FINISHED = "run_finished"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    jobs = relationship("Job", back_populates="created_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Machine(Base):
    __tablename__ = "machines"
    
    id = Column(String(36), primary_key=True)
    hostname = Column(String(255), nullable=False)
    os = Column(String(50), nullable=False)
    arch = Column(String(50), nullable=False)
    labels = Column(JSON, default=dict)
    runner_version = Column(String(50), nullable=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(MachineStatus), default=MachineStatus.OFFLINE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    agents = relationship("Agent", back_populates="machine")
    runner_tokens = relationship("RunnerToken", back_populates="machine")
    leases = relationship("Lease", back_populates="machine")


class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String(36), primary_key=True)
    machine_id = Column(String(36), ForeignKey("machines.id"), nullable=False)
    name = Column(String(255), nullable=False)
    model = Column(String(100), nullable=False)
    tags = Column(ARRAY(String), default=list)
    tools = Column(JSON, default=list)
    max_concurrency = Column(Integer, default=1)
    status = Column(Enum(AgentStatus), default=AgentStatus.OFFLINE)
    current_run_id = Column(String(36), ForeignKey("runs.id"), nullable=True)
    last_error = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    machine = relationship("Machine", back_populates="agents")
    runs = relationship("Run", back_populates="agent", foreign_keys="Run.agent_id")
    current_run = relationship("Run", foreign_keys=[current_run_id])


class RunnerToken(Base):
    __tablename__ = "runner_tokens"
    
    id = Column(String(36), primary_key=True)
    machine_id = Column(String(36), ForeignKey("machines.id"), nullable=True)
    token_hash = Column(Text, nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    machine = relationship("Machine", back_populates="runner_tokens")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    priority = Column(Integer, default=5)  # 1-10, lower is higher priority
    routing = Column(JSON, default=dict)  # required_tags, preferred_machines, preferred_agents
    payload = Column(JSON, default=dict)  # freeform job payload
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    retries = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    created_by_user = relationship("User", back_populates="jobs")
    runs = relationship("Run", back_populates="job")
    lease = relationship("Lease", back_populates="job", uselist=False)


class Lease(Base):
    __tablename__ = "leases"
    
    id = Column(String(36), primary_key=True)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False, unique=True)
    machine_id = Column(String(36), ForeignKey("machines.id"), nullable=False)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    lease_expires_at = Column(DateTime(timezone=True), nullable=False)
    renewed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.LEASED)
    
    job = relationship("Job", back_populates="lease")
    machine = relationship("Machine", back_populates="leases")
    agent = relationship("Agent")
    
    __table_args__ = (
        Index('idx_lease_expires', 'lease_expires_at'),
    )


class Run(Base):
    __tablename__ = "runs"
    
    id = Column(String(36), primary_key=True)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    status = Column(Enum(RunStatus), default=RunStatus.PENDING)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    summary = Column(JSON, default=dict)  # output summary, exit code, etc.
    
    job = relationship("Job", back_populates="runs")
    agent = relationship("Agent", back_populates="runs", foreign_keys=[agent_id])
    events = relationship("Event", back_populates="run")
    artifacts = relationship("Artifact", back_populates="run")


class Event(Base):
    __tablename__ = "events"
    
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False)
    ts = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(Enum(EventType), nullable=False)
    data = Column(JSON, default=dict)  # event-specific data
    
    run = relationship("Run", back_populates="events")
    
    __table_args__ = (
        Index('idx_event_run_ts', 'run_id', 'ts'),
    )


class Artifact(Base):
    __tablename__ = "artifacts"
    
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False)
    name = Column(String(500), nullable=False)
    storage_uri = Column(Text, nullable=False)  # s3://bucket/key
    checksum = Column(String(64), nullable=True)  # sha256
    size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    run = relationship("Run", back_populates="artifacts")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(36), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45), nullable=True)
    
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_audit_user_time', 'user_id', 'created_at'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
    )


# Import models into package namespace
__all__ = [
    'Base',
    'User', 'UserRole',
    'Machine', 'MachineStatus',
    'Agent', 'AgentStatus',
    'Job', 'JobStatus',
    'Lease',
    'Run', 'RunStatus',
    'Event', 'EventType',
    'Artifact',
    'RunnerToken',
    'AuditLog',
]
