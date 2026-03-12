import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.construction.material import ConstructionMaterialUnit


class ShipmentStatus(str, enum.Enum):
    ordered = "ordered"
    in_transit = "in_transit"
    delivered = "delivered"
    partial = "partial"
    rejected = "rejected"
    returned = "returned"


class ConstructionShipment(Base):
    __tablename__ = "construction_shipments"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    material_id: Mapped[int | None] = mapped_column(
        ForeignKey("construction_materials.id", ondelete="SET NULL"), nullable=True
    )
    material_name: Mapped[str] = mapped_column(String(255), nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity_ordered: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity_delivered: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    unit: Mapped[ConstructionMaterialUnit] = mapped_column(
        SAEnum(ConstructionMaterialUnit, name="construction_material_unit", create_type=False),
        nullable=False,
    )
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    total_cost: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(
        SAEnum(ShipmentStatus, name="shipment_status"),
        nullable=False,
        default=ShipmentStatus.ordered,
    )
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    delivery_note_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ(timezone=True), server_default=func.now()
    )

    project: Mapped["ConstructionProject"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="shipments"
    )
    material: Mapped["ConstructionMaterial"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    receiver: Mapped["User"] = relationship(foreign_keys=[received_by])  # type: ignore[name-defined]  # noqa: F821
