from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.budget_line import BudgetCategory


class BudgetLineCreate(BaseModel):
    category: BudgetCategory
    description: str | None = None
    planned_amount: Decimal
    actual_amount: Decimal = Decimal("0")
    notes: str | None = None


class BudgetLineUpdate(BaseModel):
    category: BudgetCategory | None = None
    description: str | None = None
    planned_amount: Decimal | None = None
    actual_amount: Decimal | None = None
    notes: str | None = None


class BudgetLineResponse(BaseModel):
    id: int
    project_id: int
    category: BudgetCategory
    description: str | None
    planned_amount: Decimal
    actual_amount: Decimal
    notes: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class BudgetSummaryResponse(BaseModel):
    lines: list[BudgetLineResponse]
    total_planned: Decimal
    total_actual: Decimal
    variance: Decimal
    utilization_pct: float
