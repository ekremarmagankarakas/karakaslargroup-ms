import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class PunchListStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    verified = "verified"
    rejected = "rejected"


class ConstructionPunchListItem(Base):
    __tablename__ = "construction_punch_list_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location_on_site: Mapped[str | None] = mapped_column(String(255))
    subcontractor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("construction_subcontractors.id", ondelete="SET NULL"), nullable=True
    )
    assigned_to: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[PunchListStatus] = mapped_column(
        SAEnum(PunchListStatus, name="punch_list_status"),
        nullable=False,
        default=PunchListStatus.open,
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    verified_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    photo_key: Mapped[str | None] = mapped_column(String(500))
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="punch_list_items")
    subcontractor: Mapped["ConstructionSubcontractor | None"] = relationship(foreign_keys=[subcontractor_id])
    assignee: Mapped["User | None"] = relationship(foreign_keys=[assigned_to])
    verifier: Mapped["User | None"] = relationship(foreign_keys=[verified_by])
    creator: Mapped["User | None"] = relationship(foreign_keys=[created_by])
