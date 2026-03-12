import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ConstructionMaterialUnit(str, enum.Enum):
    m3 = "m3"
    kg = "kg"
    ton = "ton"
    adet = "adet"
    m2 = "m2"
    m = "m"
    litre = "litre"


class ConstructionMaterial(Base):
    __tablename__ = "construction_materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    material_type: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[ConstructionMaterialUnit] = mapped_column(
        SAEnum(ConstructionMaterialUnit, name="construction_material_unit"),
        nullable=False,
    )
    quantity_planned: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    quantity_used: Mapped[Decimal] = mapped_column(
        Numeric(12, 3), nullable=False, server_default="0"
    )
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="materials"
    )
