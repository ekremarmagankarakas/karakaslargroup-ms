from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.permit_repository import ConstructionPermitRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.permit import PermitCreate, PermitResponse, PermitUpdate
from app.services.construction.permit_service import ConstructionPermitService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionPermitService:
    return ConstructionPermitService(
        permit_repo=ConstructionPermitRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/permits", response_model=list[PermitResponse])
async def list_permits(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_permits(project_id)


@router.post("/{project_id}/permits", response_model=PermitResponse, status_code=201)
async def create_permit(
    project_id: int,
    body: PermitCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_permit(project_id, body)


@router.patch("/{project_id}/permits/{permit_id}", response_model=PermitResponse)
async def update_permit(
    project_id: int,
    permit_id: int,
    body: PermitUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_permit(project_id, permit_id, body)


@router.delete("/{project_id}/permits/{permit_id}", status_code=204)
async def delete_permit(
    project_id: int,
    permit_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_permit(project_id, permit_id)
