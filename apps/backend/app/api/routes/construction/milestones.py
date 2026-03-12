from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.milestone_repository import ConstructionMilestoneRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.milestone import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from app.services.construction.milestone_service import ConstructionMilestoneService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionMilestoneService:
    return ConstructionMilestoneService(
        milestone_repo=ConstructionMilestoneRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/milestones", response_model=list[MilestoneResponse])
async def list_milestones(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.list_milestones(project_id)


@router.post("/{project_id}/milestones", response_model=MilestoneResponse, status_code=201)
async def add_milestone(
    project_id: int,
    body: MilestoneCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.add_milestone(project_id, body)


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    project_id: int,
    milestone_id: int,
    body: MilestoneUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_milestone(project_id, milestone_id, body)


@router.delete("/{project_id}/milestones/{milestone_id}", status_code=204)
async def delete_milestone(
    project_id: int,
    milestone_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_milestone(project_id, milestone_id)
