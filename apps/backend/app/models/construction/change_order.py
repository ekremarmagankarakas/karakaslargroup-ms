import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

class ChangeOrderStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"

class ConstructionChangeOrder(Base):
    __tablename__ = "construction_change_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    cost_delta: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    schedule_delta_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[ChangeOrderStatus] = mapped_column(SAEnum(ChangeOrderStatus, name="change_order_status"), nullable=False, default=ChangeOrderStatus.draft)
    requested_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ(timezone=True), nullable=True)

    project: Mapped["ConstructionProject"] = relationship(back_populates="change_orders")  # type: ignore[name-defined]  # noqa: F821
    requester: Mapped["User | None"] = relationship(foreign_keys=[requested_by])  # type: ignore[name-defined]  # noqa: F821
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by])  # type: ignore[name-defined]  # noqa: F821
