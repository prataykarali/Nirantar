"""Resolve a sync SQLAlchemy URL for local SQLite and hosted PostgreSQL.

Antideploy injects DATABASE_URL and requires SSL:
https://antideploy.com/docs/guides/deploy-an-app-with-a-database.md
"""

from __future__ import annotations

import os
from urllib.parse import parse_qsl, quote_plus, urlencode, urlparse, urlunparse


def _first_env(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return None


def _is_unix_socket(url: str) -> bool:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    host = query.get("host") or parsed.hostname or ""
    return host.startswith("/")


def _ensure_postgres_ssl(url: str) -> str:
    """Antideploy (and most hosted Postgres) reject non-SSL clients."""
    if not url.startswith("postgresql"):
        return url
    if _is_unix_socket(url):
        return url
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "sslmode" not in query:
        # prefer: use SSL when the server offers it, still work when it does not.
        query["sslmode"] = "prefer"
        url = urlunparse(parsed._replace(query=urlencode(query)))
    return url


def normalize_database_url(url: str | None) -> str:
    """Convert async / Heroku / Supabase URLs into a sync psycopg2 or SQLite URL."""
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

    # Handle pgbouncer parameter from Prisma / Supabase connection strings
    if "?" in url:
        parsed = urlparse(url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.pop("pgbouncer", None)  # psycopg2 handles pooler port directly
        if "sslmode" not in query and ("supabase" in parsed.netloc or "vercel-storage" in parsed.netloc or "aws" in parsed.netloc):
            query["sslmode"] = "require"
        url = urlunparse(parsed._replace(query=urlencode(query)))

    if "unix_sock=" in url:
        parsed = urlparse(url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        sock = query.pop("unix_sock", "")
        if sock.endswith("/.s.PGSQL.5432"):
            sock = sock[: -len("/.s.PGSQL.5432")]
        if sock and "host" not in query:
            query["host"] = sock
        url = urlunparse(parsed._replace(query=urlencode(query)))

    return _ensure_postgres_ssl(url)


def _format_instance_host(instance: str) -> str:
    if instance.startswith("/cloudsql/"):
        return instance
    if ":" in instance and not instance.startswith("/"):
        return f"/cloudsql/{instance}"
    return instance


def resolve_database_url() -> str:
    """Prefer DATABASE_URL, Supabase/Vercel Postgres env vars, discrete credentials, then SQLite."""
    direct = _first_env(
        "DATABASE_URL",
        "POSTGRES_URL_NON_POOLING",
        "POSTGRES_PRISMA_URL",
        "POSTGRES_URL",
        "SUPABASE_DB_URL",
        "CLOUDSQL_URL",
        "CLOUD_SQL_DATABASE_URL",
        "SQLALCHEMY_DATABASE_URI",
    )
    if direct:
        return normalize_database_url(direct)

    user = _first_env("POSTGRES_USER", "DB_USER", "DATABASE_USER", "SUPABASE_USER") or "postgres"
    password = _first_env(
        "POSTGRES_PASSWORD", "DB_PASS", "DB_PASSWORD", "DATABASE_PASSWORD", "SUPABASE_PASSWORD"
    ) or ""
    name = _first_env(
        "POSTGRES_DATABASE", "POSTGRES_DB", "DB_NAME", "DATABASE_NAME", "SUPABASE_DATABASE"
    ) or "postgres"
    host = _first_env("POSTGRES_HOST", "DB_HOST", "DATABASE_HOST", "SUPABASE_HOST")
    port = _first_env("POSTGRES_PORT", "DB_PORT", "SUPABASE_PORT") or "5432"
    instance = _first_env(
        "INSTANCE_CONNECTION_NAME",
        "CLOUD_SQL_CONNECTION_NAME",
        "CLOUDSQL_CONNECTION_NAME",
        "INSTANCE_UNIX_SOCKET",
    )

    if not instance and not host:
        return "sqlite:////tmp/nirantar_journey.db"

    auth = f"{quote_plus(user)}:{quote_plus(password)}"
    dbname = quote_plus(name)

    if instance:
        host_q = _format_instance_host(instance)
        return f"postgresql://{auth}@/{dbname}?host={host_q}"

    return _ensure_postgres_ssl(
        f"postgresql://{auth}@{host}:{port}/{dbname}"
    )
