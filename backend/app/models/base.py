"""
NIRANTAR — Database Base & Engine Setup
========================================
SQLAlchemy declarative base + database engine configuration.
Uses PostgreSQL via docker-compose, with SQLite fallback for local dev.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from contextlib import contextmanager


def normalize_database_url(url: str | None) -> str:
    """Convert async / Heroku-style URLs into a sync SQLAlchemy URL."""
    if not url:
        return "sqlite:///./nirantar_journey.db"
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql+asyncpg://"):
        url = "postgresql://" + url[len("postgresql+asyncpg://") :]
    if url.startswith("sqlite+aiosqlite://"):
        url = "sqlite://" + url[len("sqlite+aiosqlite://") :]
    return url


DATABASE_URL = normalize_database_url(
    os.getenv("DATABASE_URL", "sqlite:///./nirantar_journey.db")
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Session:
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session():
    """Context manager for database sessions outside of FastAPI."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Create all tables. Call this on startup."""
    import backend.app.models.journey_models  # noqa: F401

    Base.metadata.create_all(bind=engine)
