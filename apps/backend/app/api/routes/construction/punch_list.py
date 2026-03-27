from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.models.construction.punch_list_item import PunchListStatus
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.punch_list_repository import PunchListRepository
from app.schemas.construction.punch_list import PunchListItemCreate, PunchListItemResponse, PunchListItemUpdate
from app.services.construction.punch_list_service import PunchListService

router = APIRouter()


def _get_service(db: AsyncSession) -> PunchListService:
    return PunchListService(
        punch_repo=PunchListRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/punch-list", response_model=list[PunchListItemResponse])
async def list_punch_list(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    filter_status: PunchListStatus | None = Query(default=None, alias="status"),
):
    return await _get_service(db).list_items(project_id, filter_status)


@router.post("/{project_id}/punch-list", response_model=PunchListItemResponse, status_code=201)
async def create_punch_list_item(
    project_id: int,
    body: PunchListItemCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_item(current_user, project_id, body)


@router.patch("/{project_id}/punch-list/{item_id}", response_model=PunchListItemResponse)
async def update_punch_list_item(
    project_id: int,
    item_id: int,
    body: PunchListItemUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_item(current_user, project_id, item_id, body)


@router.post("/{project_id}/punch-list/{item_id}/verify", response_model=PunchListItemResponse)
async def verify_punch_list_item(
    project_id: int,
    item_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).verify_item(current_user, project_id, item_id)


@router.delete("/{project_id}/punch-list/{item_id}", status_code=204)
async def delete_punch_list_item(
    project_id: int,
    item_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_item(project_id, item_id)
