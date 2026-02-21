#!/usr/bin/env python3
"""Seed script to create the first Owner user."""

import asyncio
import os
import sys
sys.path.insert(0, '/app')

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash, generate_id
from app.models import User, UserRole


async def create_owner(email: str, password: str):
    """Create an Owner user if not exists."""
    async with AsyncSessionLocal() as db:
        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            print(f"User {email} already exists, skipping creation")
            return
        
        # Check if any owner exists
        result = await db.execute(select(User).where(User.role == UserRole.OWNER))
        if result.scalar_one_or_none():
            print("An Owner user already exists, skipping creation")
            return
        
        user = User(
            id=generate_id(),
            email=email,
            password_hash=get_password_hash(password),
            role=UserRole.OWNER
        )
        db.add(user)
        await db.commit()
        print(f"Created Owner user: {user.id}")
        print(f"Email: {email}")


if __name__ == "__main__":
    # Use environment variables or command line args
    email = os.environ.get('ADMIN_EMAIL') or (sys.argv[1] if len(sys.argv) > 1 else 'admin@localhost')
    password = os.environ.get('ADMIN_PASSWORD') or (sys.argv[2] if len(sys.argv) > 2 else 'admin')
    
    asyncio.run(create_owner(email, password))
