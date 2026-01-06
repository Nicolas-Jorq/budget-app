"""
Database service for connecting to PostgreSQL.

Reads the same database as the main Node.js backend.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from typing import Optional
import pandas as pd

# Global engine and session factory
engine = None
async_session: Optional[sessionmaker] = None


def get_database_url() -> str:
    """Get database URL from environment, converting to async format."""
    url = os.getenv("DATABASE_URL", "postgresql://localhost:5432/budget_app")

    # Remove schema parameter (not supported by asyncpg)
    if "?" in url:
        url = url.split("?")[0]

    # Convert postgresql:// to postgresql+asyncpg://
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    return url


async def init_db():
    """Initialize database connection."""
    global engine, async_session

    database_url = get_database_url()
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Test connection
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
    print(f"Connected to database")


async def close_db():
    """Close database connection."""
    global engine
    if engine:
        await engine.dispose()


async def get_session() -> AsyncSession:
    """Get a database session."""
    if async_session is None:
        raise RuntimeError("Database not initialized")
    async with async_session() as session:
        yield session


async def fetch_user_transactions(user_id: str, limit: int = 1000) -> pd.DataFrame:
    """Fetch user transactions as a DataFrame."""
    if async_session is None:
        raise RuntimeError("Database not initialized")

    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT
                    t.id,
                    t.amount,
                    t.type,
                    t.category,
                    t.description,
                    t.date,
                    t."createdAt"
                FROM transactions t
                WHERE t."userId" = :user_id
                ORDER BY t.date DESC
                LIMIT :limit
            """),
            {"user_id": user_id, "limit": limit}
        )
        rows = result.fetchall()

        if not rows:
            return pd.DataFrame(columns=["id", "amount", "type", "category", "description", "date", "createdAt"])

        df = pd.DataFrame(rows, columns=["id", "amount", "type", "category", "description", "date", "createdAt"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        df["date"] = pd.to_datetime(df["date"])
        return df


async def fetch_user_goals(user_id: str) -> pd.DataFrame:
    """Fetch user savings goals as a DataFrame."""
    if async_session is None:
        raise RuntimeError("Database not initialized")

    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT
                    g.id,
                    g.name,
                    g.type,
                    g."targetAmount",
                    g."currentAmount",
                    g.deadline,
                    g."createdAt"
                FROM savings_goals g
                WHERE g."userId" = :user_id
                ORDER BY g."createdAt" DESC
            """),
            {"user_id": user_id}
        )
        rows = result.fetchall()

        if not rows:
            return pd.DataFrame(columns=["id", "name", "type", "targetAmount", "currentAmount", "deadline", "createdAt"])

        df = pd.DataFrame(rows, columns=["id", "name", "type", "targetAmount", "currentAmount", "deadline", "createdAt"])
        df["targetAmount"] = pd.to_numeric(df["targetAmount"], errors="coerce")
        df["currentAmount"] = pd.to_numeric(df["currentAmount"], errors="coerce")
        return df


async def fetch_user_contributions(user_id: str, goal_id: str = None) -> pd.DataFrame:
    """Fetch contributions for a user or specific goal."""
    if async_session is None:
        raise RuntimeError("Database not initialized")

    async with async_session() as session:
        if goal_id:
            query = text("""
                SELECT
                    c.id,
                    c.amount,
                    c."goalId",
                    c."createdAt"
                FROM contributions c
                JOIN savings_goals g ON c."goalId" = g.id
                WHERE g."userId" = :user_id AND c."goalId" = :goal_id
                ORDER BY c."createdAt" DESC
            """)
            params = {"user_id": user_id, "goal_id": goal_id}
        else:
            query = text("""
                SELECT
                    c.id,
                    c.amount,
                    c."goalId",
                    c."createdAt"
                FROM contributions c
                JOIN savings_goals g ON c."goalId" = g.id
                WHERE g."userId" = :user_id
                ORDER BY c."createdAt" DESC
            """)
            params = {"user_id": user_id}

        result = await session.execute(query, params)
        rows = result.fetchall()

        if not rows:
            return pd.DataFrame(columns=["id", "amount", "goalId", "createdAt"])

        df = pd.DataFrame(rows, columns=["id", "amount", "goalId", "createdAt"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        df["createdAt"] = pd.to_datetime(df["createdAt"])
        return df
