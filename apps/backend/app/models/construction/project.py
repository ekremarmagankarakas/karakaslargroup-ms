import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ConstructionProjectStatus(str, enum.Enum):
    planning = "planning"
    active = "active"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class ConstructionProjectType(str, enum.Enum):
    shopping_mall = "shopping_mall"
    residential = "residential"
    office = "office"
    mixed_use = "mixed_use"
    hotel = "hotel"
    industrial = "industrial"
    other = "other"


class ConstructionProject(Base):
    __tablename__ = "construction_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[ConstructionProjectStatus] = mapped_column(
        SAEnum(ConstructionProjectStatus, name="construction_project_status"),
        default=ConstructionProjectStatus.planning,
        nullable=False,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    project_type: Mapped[ConstructionProjectType | None] = mapped_column(
        SAEnum(ConstructionProjectType, name="construction_project_type"),
        nullable=True,
        default=ConstructionProjectType.other,
    )
    progress_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    location: Mapped["Location | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        foreign_keys=[location_id]
    )
    creator: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        foreign_keys=[created_by]
    )
    materials: Mapped[list["ConstructionMaterial"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    milestones: Mapped[list["ConstructionMilestone"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    issues: Mapped[list["ConstructionIssue"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    photos: Mapped[list["ConstructionPhoto"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    comments: Mapped[list["ConstructionComment"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    daily_logs: Mapped[list["ConstructionDailyLog"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    subcontractors: Mapped[list["ConstructionSubcontractor"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    permits: Mapped[list["ConstructionPermit"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    change_orders: Mapped[list["ConstructionChangeOrder"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    audit_logs: Mapped[list["ConstructionAuditLog"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    documents: Mapped[list["ConstructionDocument"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    shipments: Mapped[list["ConstructionShipment"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    members: Mapped[list["ConstructionProjectMember"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
