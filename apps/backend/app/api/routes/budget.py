from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, get_db
from app.models.requirement import Requirement, RequirementStatus
from app.repositories.budget_repository import BudgetRepository
from app.schemas.budget import BudgetLimitCreate, BudgetLimitResponse, BudgetStatusResponse

router = APIRouter()


@router.get("/", response_model=BudgetStatusResponse)
async def get_budget_status(
    _: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    month: int | None = None,
    year: int | None = None,
):
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    repo = BudgetRepository(db)
    budget = await repo.get_for_period(target_month, target_year)

    # Calculate spend for the period (accepted requirements)
    stmt = select(
        func.coalesce(
            func.sum(case((Requirement.status == RequirementStatus.accepted, Requirement.price))), 0
        ).label("used")
    ).where(
        func.extract("month", Requirement.created_at) == target_month,
        func.extract("year", Requirement.created_at) == target_year,
    )
    result = await db.execute(stmt)
    used = result.scalar_one() or Decimal("0")

    return BudgetStatusResponse(
        budget_amount=budget.amount if budget else None,
        budget_used=used,
        budget_period_month=target_month,
        budget_period_year=target_year,
    )


@router.post("/", response_model=BudgetLimitResponse)
async def set_budget(
    body: BudgetLimitCreate,
    current_user: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = BudgetRepository(db)
    budget = await repo.upsert(body.amount, body.period_month, body.period_year, current_user.id)
    return BudgetLimitResponse.model_validate(budget)
