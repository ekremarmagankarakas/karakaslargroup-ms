import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class IncidentType(str, enum.Enum):
    near_miss = "near_miss"
    minor_injury = "minor_injury"
    major_injury = "major_injury"
    property_damage = "property_damage"
    environmental = "environmental"
    fire = "fire"
    other = "other"


class IncidentStatus(str, enum.Enum):
    reported = "reported"
    under_investigation = "under_investigation"
    corrective_action_pending = "corrective_action_pending"
    closed = "closed"


class ConstructionSafetyIncident(Base):
    __tablename__ = "construction_safety_incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    incident_type: Mapped[IncidentType] = mapped_column(
        SAEnum(IncidentType, name="incident_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location_on_site: Mapped[str | None] = mapped_column(String(255))
    incident_date: Mapped[date] = mapped_column(Date, nullable=False)
    injured_person_name: Mapped[str | None] = mapped_column(String(255))
    time_lost_days: Mapped[int | None] = mapped_column(Integer)
    root_cause: Mapped[str | None] = mapped_column(Text)
    corrective_actions: Mapped[str | None] = mapped_column(Text)
    status: Mapped[IncidentStatus] = mapped_column(
        SAEnum(IncidentStatus, name="incident_status"),
        nullable=False,
        default=IncidentStatus.reported,
    )
    reported_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ(timezone=True))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="safety_incidents")
    reporter: Mapped["User | None"] = relationship(foreign_keys=[reported_by])
