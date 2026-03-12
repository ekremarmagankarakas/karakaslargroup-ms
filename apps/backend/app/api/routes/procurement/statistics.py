from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.models.user import UserRole
from app.repositories.procurement.requirement_repository import RequirementRepository
from app.schemas.statistics import (
    LocationStatsItem,
    LocationStatsResponse,
    SpendDataPoint,
    SpendOverTimeResponse,
    StatisticsResponse,
    TopRequesterItem,
    TopRequestersResponse,
)

router = APIRouter()

TURKISH_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]


def _fill_and_label_months(rows: list[dict], year: int | None, month: int | None) -> list[SpendDataPoint]:
    today = date.today()

    if year and month:
        months = [(year, month)]
    elif year:
        months = [(year, m) for m in range(1, 13)]
    else:
        months = []
        for i in range(11, -1, -1):
            offset = today.month - 1 - i
            m = offset % 12 + 1
            y = today.year if offset >= 0 else today.year - 1
            months.append((y, m))

    row_map = {(r["year"], r["month"]): r for r in rows}

    result = []
    for y, m in months:
        row = row_map.get((y, m))
        label = f"{TURKISH_MONTHS[m - 1]} {y}" if not (year and month) else TURKISH_MONTHS[m - 1]
        result.append(
            SpendDataPoint(
                year=y,
                month=m,
                month_label=label,
                total_price=row["total_price"] if row else 0,
                accepted_price=row["accepted_price"] if row else 0,
                count=row["count"] if row else 0,
            )
        )
    return result


@router.get("/", response_model=StatisticsResponse)
async def get_statistics(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = None,
    user_id: int | None = None,
    paid: bool | None = None,
    month: int | None = None,
    year: int | None = None,
):
    repo = RequirementRepository(db)
    data = await repo.get_statistics(
        user_id=current_user.id,
        role=current_user.role,
        search=search,
        filter_user_id=user_id,
        paid=paid,
        month=month,
        year=year,
    )
    return StatisticsResponse(**data)


@router.get("/spend-over-time", response_model=SpendOverTimeResponse)
async def get_spend_over_time(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: int | None = None,
    paid: bool | None = None,
    month: int | None = None,
    year: int | None = None,
):
    repo = RequirementRepository(db)
    rows = await repo.get_spend_over_time(
        user_id=current_user.id,
        role=current_user.role,
        filter_user_id=user_id,
        paid=paid,
        month=month,
        year=year,
    )
    return SpendOverTimeResponse(data=_fill_and_label_months(rows, year=year, month=month))


@router.get("/by-location", response_model=LocationStatsResponse)
async def get_stats_by_location(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    month: int | None = None,
    year: int | None = None,
):
    if current_user.role == UserRole.employee:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Erişim reddedildi")

    manager_location_ids = None
    if current_user.role == UserRole.manager:
        from app.repositories.location_repository import LocationRepository
        loc_repo = LocationRepository(db)
        manager_location_ids = await loc_repo.get_location_ids_for_user(current_user.id)

    repo = RequirementRepository(db)
    rows = await repo.get_stats_by_location(
        role=current_user.role,
        month=month,
        year=year,
        manager_location_ids=manager_location_ids,
    )
    return LocationStatsResponse(data=[LocationStatsItem(**r) for r in rows])


@router.get("/top-requesters", response_model=TopRequestersResponse)
async def get_top_requesters(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 8,
    paid: bool | None = None,
    month: int | None = None,
    year: int | None = None,
):
    if current_user.role == UserRole.employee:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Erişim reddedildi")
    repo = RequirementRepository(db)
    rows = await repo.get_top_requesters(limit=limit, paid=paid, month=month, year=year)
    return TopRequestersResponse(data=[TopRequesterItem(**r) for r in rows])
