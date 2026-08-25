"""Create application tables (idempotent).

Revision ID: 001_initial_schema
Revises: initial_migration
Create Date: 2026-08-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "001_initial_schema"
down_revision: Union[str, None] = "initial_migration"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing() -> set[str]:
    return set(inspect(op.get_bind()).get_table_names())


def upgrade() -> None:
    existing = _existing()

    if "stations" not in existing:
        op.create_table(
            "stations",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("code", sa.String(10), nullable=False, unique=True, index=True),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("city", sa.String(50), nullable=False),
            sa.Column("state", sa.String(50), nullable=False),
            sa.Column("aliases", sa.JSON()),
        )

    if "trains" not in existing:
        op.create_table(
            "trains",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("train_number", sa.String(10), nullable=False, unique=True, index=True),
            sa.Column("train_name", sa.String(100), nullable=False),
            sa.Column("train_type", sa.String(30), server_default="SUPERFAST"),
            sa.Column("from_station_code", sa.String(10), nullable=False),
            sa.Column("to_station_code", sa.String(10), nullable=False),
            sa.Column("departure_time", sa.String(10), nullable=False),
            sa.Column("arrival_time", sa.String(10), nullable=False),
            sa.Column("duration_minutes", sa.Integer(), nullable=False),
            sa.Column("running_days", sa.JSON()),
            sa.Column("total_distance_km", sa.Integer(), server_default="0"),
        )

    if "train_availabilities" not in existing:
        op.create_table(
            "train_availabilities",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("train_id", sa.String(), sa.ForeignKey("trains.id"), nullable=False),
            sa.Column("travel_date", sa.String(15), nullable=False),
            sa.Column("class_code", sa.String(5), nullable=False),
            sa.Column("quota", sa.String(30), server_default="General (GN)"),
            sa.Column("fare", sa.Integer(), nullable=False),
            sa.Column("available_seats", sa.Integer(), server_default="0"),
            sa.Column("status", sa.String(20), server_default="AVAILABLE"),
            sa.Column("rac_seats", sa.Integer(), server_default="0"),
            sa.Column("wl_number", sa.Integer(), server_default="0"),
        )

    if "users" not in existing:
        op.create_table(
            "users",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("display_name", sa.String(100), nullable=False),
            sa.Column("username", sa.String(100), nullable=False, unique=True, index=True),
            sa.Column("email", sa.String(150), unique=True, index=True),
            sa.Column("phone", sa.String(20)),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("oauth_provider", sa.String(30), server_default="LOCAL"),
            sa.Column("oauth_id", sa.String(100)),
            sa.Column("avatar_url", sa.String(255)),
            sa.Column("wallet_balance", sa.Float(), server_default="10000"),
            sa.Column("preferences", sa.JSON()),
            sa.Column("created_at", sa.DateTime()),
        )

    if "user_saved_passengers" not in existing:
        op.create_table(
            "user_saved_passengers",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("age", sa.Integer(), nullable=False),
            sa.Column("gender", sa.String(1), nullable=False),
            sa.Column("berth_preference", sa.String(20), server_default="NO_PREFERENCE"),
            sa.Column("senior_citizen_concession", sa.Boolean(), server_default=sa.false()),
            sa.Column("id_proof_type", sa.String(30), server_default="Aadhaar Card"),
            sa.Column("nationality", sa.String(30), server_default="Indian"),
            sa.Column("created_at", sa.DateTime()),
        )

    if "user_tickets" not in existing:
        op.create_table(
            "user_tickets",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("pnr_number", sa.String(20), nullable=False, unique=True, index=True),
            sa.Column("train_number", sa.String(10), nullable=False),
            sa.Column("train_name", sa.String(100), nullable=False),
            sa.Column("from_station_code", sa.String(10), nullable=False),
            sa.Column("from_station_name", sa.String(100), nullable=False),
            sa.Column("to_station_code", sa.String(10), nullable=False),
            sa.Column("to_station_name", sa.String(100), nullable=False),
            sa.Column("departure_time", sa.String(10), server_default="16:55"),
            sa.Column("arrival_time", sa.String(10), server_default="08:35"),
            sa.Column("travel_date", sa.String(20), nullable=False),
            sa.Column("class_code", sa.String(10), nullable=False),
            sa.Column("coach", sa.String(10), server_default="S5"),
            sa.Column("seat_number", sa.Integer(), server_default="36"),
            sa.Column("fare", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(20), server_default="CONFIRMED"),
            sa.Column("passengers", sa.JSON()),
            sa.Column("created_at", sa.DateTime()),
        )

    if "user_transactions" not in existing:
        op.create_table(
            "user_transactions",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("type", sa.String(20), nullable=False),
            sa.Column("description", sa.String(255), nullable=False),
            sa.Column("reference_id", sa.String(50), nullable=False),
            sa.Column("balance_after", sa.Float(), nullable=False),
            sa.Column("created_at", sa.DateTime()),
        )

    if "journeys" not in existing:
        op.create_table(
            "journeys",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id")),
            sa.Column("origin_code", sa.String(10), nullable=False),
            sa.Column("destination_code", sa.String(10), nullable=False),
            sa.Column("travel_date", sa.String(15), nullable=False),
            sa.Column("passengers_count", sa.Integer(), server_default="1"),
            sa.Column("class_type", sa.String(30), server_default="All Classes"),
            sa.Column("quota", sa.String(30), server_default="General (GN)"),
            sa.Column("current_step", sa.String(30), server_default="DISCOVER"),
            sa.Column("selected_train_number", sa.String(10)),
            sa.Column("selected_class_code", sa.String(5)),
            sa.Column("status", sa.String(20), server_default="ACTIVE"),
            sa.Column("created_at", sa.DateTime()),
            sa.Column("updated_at", sa.DateTime()),
        )

    if "passenger_drafts" not in existing:
        op.create_table(
            "passenger_drafts",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("journey_id", sa.String(), sa.ForeignKey("journeys.id"), nullable=False),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("age", sa.Integer(), nullable=False),
            sa.Column("gender", sa.String(1), nullable=False),
            sa.Column("berth_preference", sa.String(20), server_default="NO_PREFERENCE"),
            sa.Column("senior_citizen_concession", sa.Boolean(), server_default=sa.false()),
            sa.Column("id_proof_type", sa.String(30), server_default="Aadhaar Card"),
            sa.Column("nationality", sa.String(30), server_default="Indian"),
        )

    if "bookings" not in existing:
        op.create_table(
            "bookings",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("journey_id", sa.String(), sa.ForeignKey("journeys.id"), nullable=False, unique=True),
            sa.Column("booking_reference", sa.String(20), nullable=False, unique=True),
            sa.Column("pnr_number", sa.String(20), nullable=False, unique=True),
            sa.Column("train_number", sa.String(10), nullable=False),
            sa.Column("train_name", sa.String(100), nullable=False),
            sa.Column("class_code", sa.String(5), nullable=False),
            sa.Column("status", sa.String(20), server_default="CONFIRMED"),
            sa.Column("coach", sa.String(10)),
            sa.Column("seat_number", sa.Integer()),
            sa.Column("berth_type", sa.String(20)),
            sa.Column("created_at", sa.DateTime()),
        )

    if "payment_attempts" not in existing:
        op.create_table(
            "payment_attempts",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("journey_id", sa.String(), sa.ForeignKey("journeys.id"), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("method", sa.String(20), nullable=False),
            sa.Column("state", sa.String(20), server_default="READY"),
            sa.Column("idempotency_key", sa.String(100), nullable=False, unique=True),
            sa.Column("transaction_ref", sa.String(50)),
            sa.Column("created_at", sa.DateTime()),
            sa.Column("updated_at", sa.DateTime()),
        )

    if "nira_events" not in existing:
        op.create_table(
            "nira_events",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("journey_id", sa.String()),
            sa.Column("intent", sa.String(50)),
            sa.Column("action", sa.String(50)),
            sa.Column("entities", sa.JSON()),
            sa.Column("validation_result", sa.String(20)),
            sa.Column("timestamp", sa.DateTime()),
        )


def downgrade() -> None:
    for table in (
        "nira_events",
        "payment_attempts",
        "bookings",
        "passenger_drafts",
        "journeys",
        "user_transactions",
        "user_tickets",
        "user_saved_passengers",
        "users",
        "train_availabilities",
        "trains",
        "stations",
    ):
        op.drop_table(table)
