from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, ManagerOrAdmin, get_db
from app.models.construction.project import ConstructionProjectStatus, ConstructionProjectType
from app.repositories.construction.audit_log_repository import ConstructionAuditLogRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.audit_log import AuditLogResponse
from app.schemas.construction.project import (
    PaginatedProjectsResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.construction.project_service import ConstructionProjectService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionProjectService:
    return ConstructionProjectService(
        project_repo=ConstructionProjectRepository(db),
        audit_repo=ConstructionAuditLogRepository(db),
    )


def _build_audit_response(log) -> AuditLogResponse:
    return AuditLogResponse(
        id=log.id,
        project_id=log.project_id,
        user_id=log.user_id,
        username=log.user.username if log.user else None,
        action=log.action,
        field_name=log.field_name,
        old_value=log.old_value,
        new_value=log.new_value,
        created_at=log.created_at,
    )


@router.get("/", response_model=PaginatedProjectsResponse)
async def list_projects(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: ConstructionProjectStatus | None = None,
    project_type: ConstructionProjectType | None = None,
    location_id: int | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
):
    service = _get_service(db)
    return await service.list_projects(
        status=status,
        project_type=project_type,
        location_id=location_id,
        search=search,
        page=page,
        limit=limit,
    )


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.create_project(current_user, body)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.get_project(project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_project(current_user, project_id, body)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    current_user: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_project(current_user, project_id)


@router.get("/{project_id}/audit-log", response_model=list[AuditLogResponse])
async def get_audit_log(
    project_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    audit_repo = ConstructionAuditLogRepository(db)
    logs = await audit_repo.get_by_project(project_id)
    return [_build_audit_response(log) for log in logs]
