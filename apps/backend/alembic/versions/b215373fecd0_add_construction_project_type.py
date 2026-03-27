"""add construction project type

Revision ID: b215373fecd0
Revises: d4ac6523b4f5
Create Date: 2026-03-12 08:53:33.909151

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b215373fecd0'
down_revision: Union[str, None] = 'd4ac6523b4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    project_type_enum = sa.Enum('shopping_mall', 'residential', 'office', 'mixed_use', 'hotel', 'industrial', 'other', name='construction_project_type')
    project_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('construction_projects', sa.Column('project_type', project_type_enum, nullable=True))


def downgrade() -> None:
    op.drop_column('construction_projects', 'project_type')
    op.execute("DROP TYPE IF EXISTS construction_project_type")
