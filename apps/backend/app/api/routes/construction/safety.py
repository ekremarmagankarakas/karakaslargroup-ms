from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.safety_incident_repository import SafetyIncidentRepository
from app.schemas.construction.safety_incident import (
    SafetyIncidentCreate,
    SafetyIncidentResponse,
    SafetyIncidentUpdate,
    SafetyStatsResponse,
)
from app.services.construction.safety_incident_service import SafetyIncidentService

router = APIRouter()


def _get_service(db: AsyncSession) -> SafetyIncidentService:
    return SafetyIncidentService(
        incident_repo=SafetyIncidentRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/safety", response_model=list[SafetyIncidentResponse])
async def list_incidents(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_incidents(project_id)


@router.get("/{project_id}/safety/stats", response_model=SafetyStatsResponse)
async def get_safety_stats(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).get_stats(project_id)


@router.post("/{project_id}/safety", response_model=SafetyIncidentResponse, status_code=201)
async def create_incident(
    project_id: int,
    body: SafetyIncidentCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_incident(current_user, project_id, body)


@router.patch("/{project_id}/safety/{incident_id}", response_model=SafetyIncidentResponse)
async def update_incident(
    project_id: int,
    incident_id: int,
    body: SafetyIncidentUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_incident(current_user, project_id, incident_id, body)


@router.delete("/{project_id}/safety/{incident_id}", status_code=204)
async def delete_incident(
    project_id: int,
    incident_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_incident(project_id, incident_id)
