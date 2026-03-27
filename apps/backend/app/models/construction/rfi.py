import enum
from datetime import date, datetime

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class RFIStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    answered = "answered"
    closed = "closed"


class RFIPriority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class ConstructionRFI(Base):
    __tablename__ = "construction_rfis"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    rfi_number: Mapped[str] = mapped_column(String(20), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RFIStatus] = mapped_column(
        SAEnum(RFIStatus, name="rfi_status"), nullable=False, default=RFIStatus.draft
    )
    priority: Mapped[RFIPriority] = mapped_column(
        SAEnum(RFIPriority, name="rfi_priority"), nullable=False, default=RFIPriority.normal
    )
    submitted_to: Mapped[str] = mapped_column(String(255), nullable=False)
    submitted_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    response_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    submitted_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    answered_by_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="rfis")
    submitter: Mapped["User | None"] = relationship(foreign_keys=[submitted_by])
