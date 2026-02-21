"""Application configuration."""

from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "OpenClaw Fleet"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/openclaw_fleet"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    # MinIO / S3
    s3_endpoint: str = "http://minio:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "openclaw-artifacts"
    s3_region: str = "us-east-1"
    s3_presign_expiry: int = 3600  # 1 hour
    
    # Auth
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24  # 1 day
    password_hash_algorithm: str = "bcrypt"
    
    # Runner
    runner_heartbeat_interval: int = 30  # seconds
    runner_heartbeat_timeout: int = 120  # seconds - mark offline after this
    lease_ttl_seconds: int = 300  # 5 minutes
    lease_renew_interval: int = 60  # seconds
    
    # Limits
    max_retries: int = 3
    default_job_timeout: int = 3600  # 1 hour
    max_event_batch_size: int = 100
    
    # Retention
    event_retention_days: int = 30
    artifact_retention_days: int = 90
    job_retention_days: int = 365
    audit_log_retention_days: int = 1095
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "https://localhost:3000"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
