from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.change_order_repository import ConstructionChangeOrderRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.change_order import ChangeOrderCreate, ChangeOrderResponse
from app.services.construction.change_order_service import ConstructionChangeOrderService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionChangeOrderService:
    return ConstructionChangeOrderService(
        co_repo=ConstructionChangeOrderRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/change-orders", response_model=list[ChangeOrderResponse])
async def list_change_orders(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_change_orders(project_id)


@router.post("/{project_id}/change-orders", response_model=ChangeOrderResponse, status_code=201)
async def create_change_order(
    project_id: int,
    body: ChangeOrderCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_change_order(current_user, project_id, body)


@router.post("/{project_id}/change-orders/{co_id}/submit", response_model=ChangeOrderResponse)
async def submit_change_order(
    project_id: int,
    co_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).submit_change_order(current_user, project_id, co_id)


@router.post("/{project_id}/change-orders/{co_id}/approve", response_model=ChangeOrderResponse)
async def approve_change_order(
    project_id: int,
    co_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).approve_change_order(current_user, project_id, co_id)


@router.post("/{project_id}/change-orders/{co_id}/reject", response_model=ChangeOrderResponse)
async def reject_change_order(
    project_id: int,
    co_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).reject_change_order(current_user, project_id, co_id)


@router.delete("/{project_id}/change-orders/{co_id}", status_code=204)
async def delete_change_order(
    project_id: int,
    co_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_change_order(current_user, project_id, co_id)
