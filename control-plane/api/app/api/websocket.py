"""WebSocket endpoint for live log streaming."""

import asyncio
import json
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Event, Run

router = APIRouter()

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, run_id: str, websocket: WebSocket):
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = set()
        self.active_connections[run_id].add(websocket)
    
    def disconnect(self, run_id: str, websocket: WebSocket):
        if run_id in self.active_connections:
            self.active_connections[run_id].discard(websocket)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]
    
    async def broadcast(self, run_id: str, message: dict):
        if run_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[run_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(run_id, conn)


manager = ConnectionManager()


@router.websocket("/ws/runs/{run_id}")
async def websocket_run_logs(websocket: WebSocket, run_id: str):
    """WebSocket endpoint for streaming run logs in real-time."""
    await manager.connect(run_id, websocket)
    
    try:
        # Send existing events first
        async with AsyncSession() as db:
            result = await db.execute(
                select(Event).where(Event.run_id == run_id).order_by(Event.ts)
            )
            events = result.scalars().all()
            
            for event in events:
                await websocket.send_json({
                    "id": event.id,
                    "type": event.type.value,
                    "data": event.data,
                    "ts": event.ts.isoformat() if event.ts else None
                })
        
        # Keep connection alive and listen for new events
        while True:
            # Client can send ping/keepalive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)


async def notify_new_event(run_id: str, event: Event):
    """Notify all connected clients of a new event."""
    await manager.broadcast(run_id, {
        "id": event.id,
        "type": event.type.value,
        "data": event.data,
        "ts": event.ts.isoformat() if event.ts else None
    })
