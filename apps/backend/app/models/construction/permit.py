import enum
from datetime import date, datetime
from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

class PermitType(str, enum.Enum):
    construction = "construction"
    demolition = "demolition"
    electrical = "electrical"
    plumbing = "plumbing"
    fire_safety = "fire_safety"
    environmental = "environmental"
    occupancy = "occupancy"
    other = "other"

class PermitStatus(str, enum.Enum):
    not_applied = "not_applied"
    applied = "applied"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    expired = "expired"

class ConstructionPermit(Base):
    __tablename__ = "construction_permits"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    permit_type: Mapped[PermitType] = mapped_column(SAEnum(PermitType, name="permit_type"), nullable=False)
    permit_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    issuing_authority: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PermitStatus] = mapped_column(SAEnum(PermitStatus, name="permit_status"), nullable=False, default=PermitStatus.not_applied)
    applied_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    approved_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="permits")  # type: ignore[name-defined]  # noqa: F821
