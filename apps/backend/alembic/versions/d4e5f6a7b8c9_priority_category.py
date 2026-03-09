"""Add priority, needed_by to requirements; add categories table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-08 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    op.execute("CREATE TYPE requirement_priority AS ENUM ('low', 'normal', 'high', 'urgent')")

    op.add_column(
        'requirements',
        sa.Column(
            'priority',
            sa.Enum('low', 'normal', 'high', 'urgent', name='requirement_priority', create_type=False),
            nullable=False,
            server_default='normal',
        ),
    )
    op.add_column('requirements', sa.Column('needed_by', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('requirements', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_requirements_category_id', 'requirements', 'categories', ['category_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_requirements_category_id', 'requirements', type_='foreignkey')
    op.drop_column('requirements', 'category_id')
    op.drop_column('requirements', 'needed_by')
    op.drop_column('requirements', 'priority')
    op.execute("DROP TYPE requirement_priority")
    op.drop_table('categories')
