import enum
from datetime import datetime

from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class BudgetCategory(str, enum.Enum):
    labor = "labor"
    materials = "materials"
    equipment = "equipment"
    subcontractors = "subcontractors"
    overhead = "overhead"
    contingency = "contingency"
    other = "other"


class ConstructionBudgetLine(Base):
    __tablename__ = "construction_budget_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[BudgetCategory] = mapped_column(
        SAEnum(BudgetCategory, name="budget_category"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text)
    planned_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    actual_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="budget_lines")
