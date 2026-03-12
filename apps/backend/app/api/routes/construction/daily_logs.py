from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.daily_log_repository import ConstructionDailyLogRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.daily_log import (
    DailyLogCreate,
    DailyLogResponse,
    DailyLogUpdate,
    PaginatedDailyLogsResponse,
)
from app.services.construction.daily_log_service import ConstructionDailyLogService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionDailyLogService:
    return ConstructionDailyLogService(
        log_repo=ConstructionDailyLogRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/daily-logs", response_model=PaginatedDailyLogsResponse)
async def list_daily_logs(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await _get_service(db).list_daily_logs(project_id, page=page, limit=limit)


@router.post("/{project_id}/daily-logs", response_model=DailyLogResponse, status_code=201)
async def create_daily_log(
    project_id: int,
    body: DailyLogCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_daily_log(current_user, project_id, body)


@router.patch("/{project_id}/daily-logs/{log_id}", response_model=DailyLogResponse)
async def update_daily_log(
    project_id: int,
    log_id: int,
    body: DailyLogUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_daily_log(current_user, project_id, log_id, body)


@router.delete("/{project_id}/daily-logs/{log_id}", status_code=204)
async def delete_daily_log(
    project_id: int,
    log_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_daily_log(current_user, project_id, log_id)
