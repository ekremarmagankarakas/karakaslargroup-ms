from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, CurrentUser, ManagerOrAdmin
from app.repositories.construction.equipment_repository import EquipmentRepository
from app.schemas.construction.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate
from app.services.construction.equipment_service import EquipmentService

router = APIRouter()


def _get_service(db: AsyncSession) -> EquipmentService:
    return EquipmentService(repo=EquipmentRepository(db))


@router.get("/{project_id}/equipment", response_model=list[EquipmentResponse])
async def list_equipment(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_equipment(project_id)


@router.post("/{project_id}/equipment", response_model=EquipmentResponse)
async def create_equipment(
    project_id: int,
    body: EquipmentCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_equipment(project_id, body, current_user.id)


@router.patch("/{project_id}/equipment/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    project_id: int,
    equipment_id: int,
    body: EquipmentUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_equipment(project_id, equipment_id, body)


@router.delete("/{project_id}/equipment/{equipment_id}", status_code=204)
async def delete_equipment(
    project_id: int,
    equipment_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_equipment(project_id, equipment_id)
