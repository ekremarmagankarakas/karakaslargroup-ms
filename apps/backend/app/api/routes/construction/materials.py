from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.material_repository import ConstructionMaterialRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.material import MaterialCreate, MaterialResponse, MaterialUpdate
from app.services.construction.material_service import ConstructionMaterialService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionMaterialService:
    return ConstructionMaterialService(
        material_repo=ConstructionMaterialRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/materials", response_model=list[MaterialResponse])
async def list_materials(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.list_materials(project_id)


@router.post("/{project_id}/materials", response_model=MaterialResponse, status_code=201)
async def add_material(
    project_id: int,
    body: MaterialCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.add_material(project_id, body)


@router.patch("/{project_id}/materials/{material_id}", response_model=MaterialResponse)
async def update_material(
    project_id: int,
    material_id: int,
    body: MaterialUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_material(project_id, material_id, body)


@router.delete("/{project_id}/materials/{material_id}", status_code=204)
async def delete_material(
    project_id: int,
    material_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_material(project_id, material_id)
