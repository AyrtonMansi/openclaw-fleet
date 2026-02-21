from fastapi import APIRouter

from app.api import auth, fleet, jobs, runner, tokens, audit, websocket

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(fleet.router)
api_router.include_router(jobs.router)
api_router.include_router(runner.router)
api_router.include_router(tokens.router)
api_router.include_router(audit.router)
api_router.include_router(websocket.router)
