import enum
from datetime import datetime
from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

class ConstructionAuditAction(str, enum.Enum):
    created = "created"
    status_changed = "status_changed"
    budget_changed = "budget_changed"
    progress_updated = "progress_updated"
    edited = "edited"

class ConstructionAuditLog(Base):
    __tablename__ = "construction_audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[ConstructionAuditAction] = mapped_column(SAEnum(ConstructionAuditAction, name="construction_audit_action"), nullable=False)
    field_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="audit_logs")  # type: ignore[name-defined]  # noqa: F821
    user: Mapped["User | None"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]  # noqa: F821
