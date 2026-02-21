"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from enum import Enum

from pydantic import BaseModel, Field, EmailStr


# ==================== Auth Schemas ====================

class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.VIEWER


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None


class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ==================== Machine Schemas ====================

class MachineStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class MachineCreate(BaseModel):
    hostname: str
    os: str
    arch: str
    labels: Dict[str, str] = Field(default_factory=dict)
    runner_version: str


class MachineResponse(BaseModel):
    id: str
    hostname: str
    os: str
    arch: str
    labels: Dict[str, Any]
    runner_version: str
    last_seen: datetime
    status: MachineStatus
    created_at: datetime
    agent_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class MachineHeartbeat(BaseModel):
    runner_version: Optional[str] = None
    labels: Optional[Dict[str, str]] = None


# ==================== Agent Schemas ====================

class AgentStatus(str, Enum):
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"


class AgentDefinition(BaseModel):
    name: str
    model: str
    tags: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    max_concurrency: int = 1


class AgentResponse(BaseModel):
    id: str
    machine_id: str
    name: str
    model: str
    tags: List[str]
    tools: List[str]
    max_concurrency: int
    status: AgentStatus
    current_run_id: Optional[str]
    last_error: Optional[str]
    updated_at: datetime
    machine_hostname: Optional[str] = None
    
    class Config:
        from_attributes = True


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    tags: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    max_concurrency: Optional[int] = None


# ==================== Job Schemas ====================

class JobStatus(str, Enum):
    QUEUED = "queued"
    LEASED = "leased"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobRouting(BaseModel):
    required_tags: List[str] = Field(default_factory=list)
    preferred_machines: List[str] = Field(default_factory=list)
    preferred_agents: List[str] = Field(default_factory=list)


class JobCreate(BaseModel):
    title: str = Field(..., max_length=500)
    priority: int = Field(default=5, ge=1, le=10)
    routing: JobRouting = Field(default_factory=JobRouting)
    payload: Dict[str, Any] = Field(default_factory=dict)
    max_retries: int = Field(default=3, ge=0, le=10)


class JobResponse(BaseModel):
    id: str
    created_by: str
    title: str
    priority: int
    routing: Dict[str, Any]
    payload: Dict[str, Any]
    status: JobStatus
    retries: int
    max_retries: int
    created_at: datetime
    updated_at: datetime
    current_lease: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int


class JobAction(str, Enum):
    CANCEL = "cancel"
    RETRY = "retry"
    REASSIGN = "reassign"


class JobActionRequest(BaseModel):
    action: JobAction
    agent_id: Optional[str] = None  # for reassign


# ==================== Run Schemas ====================

class RunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RunResponse(BaseModel):
    id: str
    job_id: str
    agent_id: str
    status: RunStatus
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    summary: Dict[str, Any]
    agent_name: Optional[str] = None
    job_title: Optional[str] = None
    duration_ms: Optional[int] = None
    
    class Config:
        from_attributes = True


class RunDetailResponse(RunResponse):
    events: List["EventResponse"] = Field(default_factory=list)
    artifacts: List["ArtifactResponse"] = Field(default_factory=list)


# ==================== Event Schemas ====================

class EventType(str, Enum):
    RUN_STARTED = "run_started"
    STDOUT = "stdout"
    STDERR = "stderr"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    ERROR = "error"
    HEARTBEAT = "heartbeat"
    ARTIFACT_UPLOADED = "artifact_uploaded"
    RUN_FINISHED = "run_finished"


class EventData(BaseModel):
    message: Optional[str] = None
    tool_name: Optional[str] = None
    tool_args: Optional[Dict[str, Any]] = None
    tool_result: Optional[Any] = None
    exit_code: Optional[int] = None
    error: Optional[str] = None


class EventCreate(BaseModel):
    type: EventType
    data: Dict[str, Any] = Field(default_factory=dict)
    ts: Optional[datetime] = None


class EventResponse(BaseModel):
    id: str
    run_id: str
    ts: datetime
    type: EventType
    data: Dict[str, Any]
    
    class Config:
        from_attributes = True


# ==================== Artifact Schemas ====================

class ArtifactResponse(BaseModel):
    id: str
    run_id: str
    name: str
    storage_uri: str
    checksum: Optional[str]
    size: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
    download_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class ArtifactInitRequest(BaseModel):
    name: str
    size: int
    mime_type: Optional[str] = None
    checksum: Optional[str] = None


class ArtifactInitResponse(BaseModel):
    artifact_id: str
    upload_url: str  # presigned URL


class ArtifactCommitRequest(BaseModel):
    artifact_id: str
    checksum: str


# ==================== Runner API Schemas ====================

class RunnerRegisterRequest(BaseModel):
    hostname: str
    os: str
    arch: str
    labels: Dict[str, str]
    runner_version: str
    agents: List[AgentDefinition]


class RunnerRegisterResponse(BaseModel):
    machine_id: str
    heartbeat_interval: int = 30


class RunnerPollRequest(BaseModel):
    machine_id: str
    agent_statuses: Dict[str, str]  # agent_id -> status
    capabilities: Dict[str, Any] = Field(default_factory=dict)


class RunnerPollResponse(BaseModel):
    jobs: List["RunnerJobOffer"]


class RunnerJobOffer(BaseModel):
    job_id: str
    title: str
    payload: Dict[str, Any]
    agent_id: str  # which agent should take it


class RunnerLeaseRequest(BaseModel):
    machine_id: str
    agent_id: str
    job_id: str


class RunnerLeaseResponse(BaseModel):
    lease_id: str
    lease_expires_at: datetime
    renew_interval: int = 30


class RunnerLeaseRenewRequest(BaseModel):
    lease_id: str


class RunnerJobCompleteRequest(BaseModel):
    run_id: str
    status: Literal["succeeded", "failed", "cancelled"]
    summary: Dict[str, Any] = Field(default_factory=dict)


class RunnerEventBatch(BaseModel):
    run_id: str
    events: List[EventCreate]


# ==================== Runner Token Schemas ====================

class RunnerTokenCreate(BaseModel):
    description: Optional[str] = None


class RunnerTokenResponse(BaseModel):
    id: str
    token: Optional[str] = None  # only shown on creation
    token_hash: str
    description: Optional[str]
    created_at: datetime
    revoked_at: Optional[datetime]
    machine_id: Optional[str]
    
    class Config:
        from_attributes = True


# ==================== Audit Log Schemas ====================

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    user_email: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Dict[str, Any]
    created_at: datetime
    ip_address: Optional[str]
    
    class Config:
        from_attributes = True


# ==================== Settings Schemas ====================

class RetentionSettings(BaseModel):
    event_retention_days: int = 30
    artifact_retention_days: int = 90
    job_retention_days: int = 365
    audit_log_retention_days: int = 1095  # 3 years


class SettingsResponse(BaseModel):
    retention: RetentionSettings
    version: str
