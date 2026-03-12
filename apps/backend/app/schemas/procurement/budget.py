from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BudgetLimitCreate(BaseModel):
    amount: Decimal
    period_month: int
    period_year: int
    location_id: int | None = None


class BudgetLimitResponse(BaseModel):
    id: int
    amount: Decimal
    period_month: int
    period_year: int
    set_by: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class BudgetStatusResponse(BaseModel):
    budget_amount: Decimal | None
    budget_used: Decimal
    budget_period_month: int | None
    budget_period_year: int | None


class BudgetHistoryItem(BaseModel):
    month: int
    year: int
    month_label: str
    budget_amount: Decimal | None
    budget_used: Decimal
    utilization_pct: float


class BudgetHistoryResponse(BaseModel):
    data: list[BudgetHistoryItem]
