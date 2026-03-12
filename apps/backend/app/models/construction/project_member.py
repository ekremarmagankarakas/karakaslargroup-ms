import enum
from datetime import date, datetime

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ConstructionProjectRole(str, enum.Enum):
    project_manager = "project_manager"
    site_engineer = "site_engineer"
    foreman = "foreman"
    architect = "architect"
    safety_officer = "safety_officer"
    consultant = "consultant"
    observer = "observer"


class ConstructionProjectMember(Base):
    __tablename__ = "construction_project_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    construction_role: Mapped[ConstructionProjectRole] = mapped_column(
        SAEnum(ConstructionProjectRole, name="construction_project_role"),
        nullable=False,
    )
    joined_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ(timezone=True), server_default=func.now()
    )

    __table_args__ = (UniqueConstraint("project_id", "user_id"),)

    project: Mapped["ConstructionProject"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="members"
    )
    user: Mapped["User"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]  # noqa: F821
