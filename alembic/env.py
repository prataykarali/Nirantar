"""Alembic env for Antideploy: `alembic upgrade head` against DATABASE_URL.

Does not import the FastAPI app (that would open a DB engine on import).
SSL is required by Antideploy's managed Postgres.
"""

from __future__ import annotations

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.models.db_url import resolve_database_url  # noqa: E402

config = context.config

try:
    if config.config_file_name is not None:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
except Exception:
    pass

target_metadata = None


def get_database_url() -> str:
    return resolve_database_url()


def run_migrations_offline() -> None:
    url = get_database_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_database_url()
    if url.startswith("postgresql") and "sslmode=require" in url:
        os.environ.setdefault("PGSSLMODE", "require")

    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        connect_args = {"connect_timeout": 30}
        if "sslmode=" in url:
            connect_args["sslmode"] = "require"

    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
