import enum
from datetime import datetime

from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ConstructionIssueSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ConstructionIssueStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"


class ConstructionIssue(Base):
    __tablename__ = "construction_issues"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[ConstructionIssueSeverity] = mapped_column(
        SAEnum(ConstructionIssueSeverity, name="construction_issue_severity"),
        default=ConstructionIssueSeverity.medium,
        nullable=False,
    )
    status: Mapped[ConstructionIssueStatus] = mapped_column(
        SAEnum(ConstructionIssueStatus, name="construction_issue_status"),
        default=ConstructionIssueStatus.open,
        nullable=False,
    )
    reported_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="issues"
    )
    reporter: Mapped["User | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        foreign_keys=[reported_by]
    )
