from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.subcontractor_repository import ConstructionSubcontractorRepository
from app.schemas.construction.subcontractor import (
    SubcontractorCreate,
    SubcontractorResponse,
    SubcontractorUpdate,
)
from app.services.construction.subcontractor_service import ConstructionSubcontractorService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionSubcontractorService:
    return ConstructionSubcontractorService(
        sub_repo=ConstructionSubcontractorRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/subcontractors", response_model=list[SubcontractorResponse])
async def list_subcontractors(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_subcontractors(project_id)


@router.post("/{project_id}/subcontractors", response_model=SubcontractorResponse, status_code=201)
async def create_subcontractor(
    project_id: int,
    body: SubcontractorCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_subcontractor(current_user, project_id, body)


@router.patch("/{project_id}/subcontractors/{sub_id}", response_model=SubcontractorResponse)
async def update_subcontractor(
    project_id: int,
    sub_id: int,
    body: SubcontractorUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_subcontractor(current_user, project_id, sub_id, body)


@router.delete("/{project_id}/subcontractors/{sub_id}", status_code=204)
async def delete_subcontractor(
    project_id: int,
    sub_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_subcontractor(current_user, project_id, sub_id)
