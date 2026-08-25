"""Standalone Alembic env for Antideploy.

No application imports. Resolves DATABASE_URL and retries SSL modes
because managed Postgres sometimes requires SSL and sometimes rejects it.
"""

from __future__ import annotations

import os
from logging.config import fileConfig
from urllib.parse import parse_qsl, quote_plus, urlencode, urlparse, urlunparse

from alembic import context
from sqlalchemy import create_engine, pool

config = context.config

try:
    if config.config_file_name is not None:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
except Exception:
    pass

target_metadata = None


def _first_env(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return None


def _normalize(url: str | None) -> str:
    if not url:
        return "sqlite:////tmp/nirantar_journey.db"
    url = url.strip().strip('"').strip("'")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    for src, dst in (
        ("postgresql+asyncpg://", "postgresql://"),
        ("postgresql+pg8000://", "postgresql://"),
        ("postgresql+psycopg://", "postgresql://"),
        ("sqlite+aiosqlite://", "sqlite://"),
    ):
        if url.startswith(src):
            url = dst + url[len(src) :]
            break
    if "unix_sock=" in url:
        parsed = urlparse(url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        sock = query.pop("unix_sock", "")
        if sock.endswith("/.s.PGSQL.5432"):
            sock = sock[: -len("/.s.PGSQL.5432")]
        if sock and "host" not in query:
            query["host"] = sock
        url = urlunparse(parsed._replace(query=urlencode(query)))
    return url


def get_database_url() -> str:
    direct = _first_env(
        "DATABASE_URL",
        "CLOUDSQL_URL",
        "CLOUD_SQL_DATABASE_URL",
        "POSTGRES_URL",
        "SQLALCHEMY_DATABASE_URI",
    )
    if direct:
        return _normalize(direct)

    user = _first_env("DB_USER", "POSTGRES_USER", "DATABASE_USER") or "postgres"
    password = _first_env(
        "DB_PASS", "DB_PASSWORD", "POSTGRES_PASSWORD", "DATABASE_PASSWORD"
    ) or ""
    name = _first_env(
        "DB_NAME", "POSTGRES_DB", "DATABASE_NAME", "POSTGRES_DATABASE"
    ) or "postgres"
    host = _first_env("DB_HOST", "POSTGRES_HOST", "DATABASE_HOST")
    port = _first_env("DB_PORT", "POSTGRES_PORT") or "5432"
    instance = _first_env(
        "INSTANCE_CONNECTION_NAME",
        "CLOUD_SQL_CONNECTION_NAME",
        "CLOUDSQL_CONNECTION_NAME",
        "INSTANCE_UNIX_SOCKET",
    )
    if instance or host:
        auth = f"{quote_plus(user)}:{quote_plus(password)}"
        dbname = quote_plus(name)
        if instance:
            socket = instance
            if socket.startswith("/cloudsql/"):
                host_q = socket
            elif ":" in socket and not socket.startswith("/"):
                host_q = f"/cloudsql/{socket}"
            else:
                host_q = socket
            return f"postgresql://{auth}@/{dbname}?host={host_q}"
        return f"postgresql://{auth}@{host}:{port}/{dbname}"

    return _normalize(config.get_main_option("sqlalchemy.url"))


def _with_sslmode(url: str, mode: str) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["sslmode"] = mode
    return urlunparse(parsed._replace(query=urlencode(query)))


def _candidate_urls(url: str) -> list[str]:
    if not url.startswith("postgresql"):
        return [url]
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    host = query.get("host") or parsed.hostname or ""
    if host.startswith("/"):
        return [url]
    ordered = []
    for mode in ("require", "prefer", "disable"):
        candidate = _with_sslmode(url, mode)
        if candidate not in ordered:
            ordered.append(candidate)
    if url not in ordered:
        ordered.insert(0, url)
    return ordered


def _engine(url: str):
    connect_args = (
        {"check_same_thread": False} if url.startswith("sqlite") else {"connect_timeout": 30}
    )
    return create_engine(
        url,
        poolclass=pool.NullPool,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


def run_migrations_offline() -> None:
    url = get_database_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_database_url()
    last_error: Exception | None = None
    for candidate in _candidate_urls(url):
        engine = _engine(candidate)
        try:
            with engine.connect() as connection:
                context.configure(
                    connection=connection, target_metadata=target_metadata
                )
                with context.begin_transaction():
                    context.run_migrations()
            return
        except Exception as err:
            last_error = err
            engine.dispose()
    if last_error is not None:
        raise last_error
    raise RuntimeError("alembic upgrade head could not connect to DATABASE_URL")


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
