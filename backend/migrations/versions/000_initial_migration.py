"""Placeholder revision kept so reused Cloud SQL DBs that stamped
`initial_migration` can still upgrade.

Revision ID: initial_migration
Revises:
Create Date: 2026-08-26

"""
from typing import Sequence, Union

revision: str = "initial_migration"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
