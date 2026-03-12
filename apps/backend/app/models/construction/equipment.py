import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class EquipmentStatus(str, enum.Enum):
    available = "available"
    in_use = "in_use"
    under_maintenance = "under_maintenance"
    out_of_service = "out_of_service"
    returned = "returned"


class EquipmentCategory(str, enum.Enum):
    heavy_machinery = "heavy_machinery"
    lifting = "lifting"
    earthmoving = "earthmoving"
    compaction = "compaction"
    concrete = "concrete"
    electrical = "electrical"
    scaffolding = "scaffolding"
    safety = "safety"
    survey = "survey"
    other = "other"


class ConstructionEquipment(Base):
    __tablename__ = "construction_equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[EquipmentCategory] = mapped_column(
        SAEnum(EquipmentCategory, name="equipment_category"),
        nullable=False,
        default=EquipmentCategory.other,
    )
    status: Mapped[EquipmentStatus] = mapped_column(
        SAEnum(EquipmentStatus, name="equipment_status"),
        nullable=False,
        default=EquipmentStatus.available,
    )
    model_number: Mapped[str | None] = mapped_column(String(255))
    serial_number: Mapped[str | None] = mapped_column(String(255))
    supplier: Mapped[str | None] = mapped_column(String(255))
    rental_rate_daily: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    mobilization_date: Mapped[date | None] = mapped_column(Date)
    demobilization_date: Mapped[date | None] = mapped_column(Date)
    last_maintenance_date: Mapped[date | None] = mapped_column(Date)
    next_maintenance_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="equipment")  # type: ignore[name-defined]  # noqa: F821
    creator: Mapped["User | None"] = relationship(foreign_keys=[created_by])  # type: ignore[name-defined]  # noqa: F821
