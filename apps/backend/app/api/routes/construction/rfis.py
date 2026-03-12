from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.rfi_repository import RFIRepository
from app.schemas.construction.rfi import RFICreate, RFIResponse, RFIUpdate
from app.services.construction.rfi_service import RFIService

router = APIRouter()


def _get_service(db: AsyncSession) -> RFIService:
    return RFIService(
        rfi_repo=RFIRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/rfis", response_model=list[RFIResponse])
async def list_rfis(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_rfis(project_id)


@router.post("/{project_id}/rfis", response_model=RFIResponse, status_code=201)
async def create_rfi(
    project_id: int,
    body: RFICreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_rfi(current_user, project_id, body)


@router.patch("/{project_id}/rfis/{rfi_id}", response_model=RFIResponse)
async def update_rfi(
    project_id: int,
    rfi_id: int,
    body: RFIUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_rfi(project_id, rfi_id, body)


@router.delete("/{project_id}/rfis/{rfi_id}", status_code=204)
async def delete_rfi(
    project_id: int,
    rfi_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_rfi(project_id, rfi_id)
