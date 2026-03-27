from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.budget_line_repository import BudgetLineRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.budget_line import BudgetLineCreate, BudgetLineResponse, BudgetLineUpdate, BudgetSummaryResponse
from app.services.construction.budget_line_service import BudgetLineService

router = APIRouter()


def _get_service(db: AsyncSession) -> BudgetLineService:
    return BudgetLineService(
        line_repo=BudgetLineRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/budget", response_model=BudgetSummaryResponse)
async def get_budget(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).get_summary(project_id)


@router.post("/{project_id}/budget/lines", response_model=BudgetLineResponse, status_code=201)
async def create_budget_line(
    project_id: int,
    body: BudgetLineCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_line(project_id, body)


@router.patch("/{project_id}/budget/lines/{line_id}", response_model=BudgetLineResponse)
async def update_budget_line(
    project_id: int,
    line_id: int,
    body: BudgetLineUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_line(project_id, line_id, body)


@router.delete("/{project_id}/budget/lines/{line_id}", status_code=204)
async def delete_budget_line(
    project_id: int,
    line_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_line(project_id, line_id)
