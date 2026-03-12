"""add construction shipments

Revision ID: d0a32bba9b6d
Revises: d1317fa36dd6
Create Date: 2026-03-12 20:56:12.181038

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd0a32bba9b6d'
down_revision: Union[str, None] = 'd1317fa36dd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE shipment_status AS ENUM (
            'ordered', 'in_transit', 'delivered', 'partial', 'rejected', 'returned'
        )
    """)
    op.execute("""
        CREATE TABLE construction_shipments (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
            material_id INTEGER REFERENCES construction_materials(id) ON DELETE SET NULL,
            material_name VARCHAR(255) NOT NULL,
            supplier_name VARCHAR(255) NOT NULL,
            quantity_ordered NUMERIC(12, 2) NOT NULL,
            quantity_delivered NUMERIC(12, 2),
            unit construction_material_unit NOT NULL,
            unit_cost NUMERIC(12, 2),
            total_cost NUMERIC(14, 2),
            status shipment_status NOT NULL DEFAULT 'ordered',
            order_date DATE NOT NULL,
            expected_delivery_date DATE,
            actual_delivery_date DATE,
            delivery_note_number VARCHAR(100),
            notes TEXT,
            received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS construction_shipments")
    op.execute("DROP TYPE IF EXISTS shipment_status")
