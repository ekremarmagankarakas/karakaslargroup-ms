from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, get_db
from app.models.procurement.requirement import Requirement, RequirementStatus
from app.repositories.procurement.budget_repository import BudgetRepository
from app.schemas.procurement.budget import BudgetHistoryItem, BudgetHistoryResponse, BudgetLimitCreate, BudgetLimitResponse, BudgetStatusResponse

router = APIRouter()

MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]


def _spend_stmt(target_month: int, target_year: int, location_id: int | None):
    stmt = select(
        func.coalesce(
            func.sum(case((Requirement.status == RequirementStatus.accepted, Requirement.price))), 0
        ).label("used")
    ).where(
        func.extract("month", Requirement.created_at) == target_month,
        func.extract("year", Requirement.created_at) == target_year,
    )
    if location_id is not None:
        stmt = stmt.where(Requirement.location_id == location_id)
    return stmt


@router.get("/", response_model=BudgetStatusResponse)
async def get_budget_status(
    _: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    month: int | None = None,
    year: int | None = None,
    location_id: int | None = None,
):
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    repo = BudgetRepository(db)
    budget = await repo.get_for_period(target_month, target_year, location_id=location_id)

    result = await db.execute(_spend_stmt(target_month, target_year, location_id))
    used = result.scalar_one() or Decimal("0")

    return BudgetStatusResponse(
        budget_amount=budget.amount if budget else None,
        budget_used=used,
        budget_period_month=target_month,
        budget_period_year=target_year,
    )


@router.get("/history", response_model=BudgetHistoryResponse)
async def get_budget_history(
    _: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    months: int = 12,
    location_id: int | None = None,
):
    now = datetime.now(timezone.utc)

    periods: list[tuple[int, int]] = []
    for i in range(months - 1, -1, -1):
        offset = now.month - 1 - i
        m = offset % 12 + 1
        y = now.year if offset >= 0 else now.year - 1
        periods.append((m, y))

    repo = BudgetRepository(db)
    budget_map = await repo.get_many_for_periods(periods, location_id=location_id)

    oldest_m, oldest_y = periods[0]
    cutoff = datetime(oldest_y, oldest_m, 1, tzinfo=timezone.utc)
    spend_stmt = select(
        func.extract("year", Requirement.created_at).label("year"),
        func.extract("month", Requirement.created_at).label("month"),
        func.coalesce(
            func.sum(case((Requirement.status == RequirementStatus.accepted, Requirement.price))), 0
        ).label("budget_used"),
    ).where(Requirement.created_at >= cutoff)

    if location_id is not None:
        spend_stmt = spend_stmt.where(Requirement.location_id == location_id)

    spend_stmt = spend_stmt.group_by(
        func.extract("year", Requirement.created_at),
        func.extract("month", Requirement.created_at),
    )
    result = await db.execute(spend_stmt)
    spend_map: dict[tuple[int, int], Decimal] = {
        (int(row.month), int(row.year)): row.budget_used for row in result.all()
    }

    data = []
    for m, y in periods:
        budget = budget_map.get((m, y))
        used = spend_map.get((m, y), Decimal("0"))
        amount = budget.amount if budget else None
        pct = float((used / amount * 100).quantize(Decimal("0.1"))) if amount and amount > 0 else 0.0
        data.append(BudgetHistoryItem(
            month=m,
            year=y,
            month_label=f"{MONTHS_TR[m - 1]} {y}",
            budget_amount=amount,
            budget_used=used,
            utilization_pct=min(pct, 999.0),
        ))

    return BudgetHistoryResponse(data=data)


@router.post("/", response_model=BudgetLimitResponse)
async def set_budget(
    body: BudgetLimitCreate,
    current_user: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = BudgetRepository(db)
    budget = await repo.upsert(
        body.amount, body.period_month, body.period_year, current_user.id,
        location_id=body.location_id,
    )
    return BudgetLimitResponse.model_validate(budget)
