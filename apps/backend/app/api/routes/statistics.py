from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.repositories.requirement_repository import RequirementRepository
from app.schemas.statistics import StatisticsResponse

router = APIRouter()


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
