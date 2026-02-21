"""Redis connection and queue management."""

import json
from typing import Any, Optional
import redis.asyncio as redis

from app.core.config import settings

# Redis client
redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get or create Redis connection."""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return redis_client


async def close_redis():
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


# Queue keys
QUEUE_KEY = "jobs:queue"
QUEUE_SCHEDULED = "jobs:scheduled"
RUNNER_HEARTBEATS = "runners:heartbeats"


async def enqueue_job(job_id: str, priority: int, delay: int = 0):
    """Add job to queue. Lower priority number = higher priority."""
    r = await get_redis()
    score = priority * 10000000000 + delay  # Combine priority and delay
    await r.zadd(QUEUE_KEY, {job_id: score})


async def dequeue_job() -> Optional[str]:
    """Get highest priority job from queue."""
    r = await get_redis()
    # Get job with lowest score (highest priority)
    result = await r.zpopmin(QUEUE_KEY, count=1)
    if result:
        return result[0][0]
    return None


async def remove_job_from_queue(job_id: str):
    """Remove job from queue."""
    r = await get_redis()
    await r.zrem(QUEUE_KEY, job_id)


async def update_runner_heartbeat(machine_id: str, data: dict):
    """Update runner heartbeat in Redis."""
    r = await get_redis()
    await r.hset(RUNNER_HEARTBEATS, machine_id, json.dumps(data))


async def get_runner_heartbeats() -> dict:
    """Get all runner heartbeats."""
    r = await get_redis()
    data = await r.hgetall(RUNNER_HEARTBEATS)
    return {k: json.loads(v) for k, v in data.items()}


async def publish_event(channel: str, data: dict):
    """Publish event to Redis pub/sub for WebSocket streaming."""
    r = await get_redis()
    await r.publish(channel, json.dumps(data))
