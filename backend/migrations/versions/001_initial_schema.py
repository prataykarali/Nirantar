"""Initial schema from SQLAlchemy models.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from backend.app.models.base import Base
    import backend.app.models.journey_models  # noqa: F401

    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    from backend.app.models.base import Base
    import backend.app.models.journey_models  # noqa: F401

    Base.metadata.drop_all(bind=op.get_bind())
