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

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./nirantar_journey.db"  # Fallback for local dev without Docker
)

# Handle async postgresql URLs
if DATABASE_URL.startswith("postgresql://"):
    connect_args = {}
elif DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
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
    Base.metadata.create_all(bind=engine)
