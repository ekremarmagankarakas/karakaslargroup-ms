import math

from fastapi import HTTPException, status

from app.models.construction.project import ConstructionProject
from app.models.user import User, UserRole
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.project import (
    PaginatedProjectsResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)


def _build_project_response(project: ConstructionProject) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        location_id=project.location_id,
        location_name=project.location.name if project.location else None,
        created_by=project.created_by,
        created_by_username=project.creator.username,
        status=project.status,
        start_date=project.start_date,
        end_date=project.end_date,
        budget=project.budget,
        progress_pct=project.progress_pct,
        created_at=project.created_at,
    )


class ConstructionProjectService:
    def __init__(self, project_repo: ConstructionProjectRepository) -> None:
        self.project_repo = project_repo

    async def list_projects(
        self,
        *,
        status: str | None = None,
        location_id: int | None = None,
        search: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedProjectsResponse:
        projects, total = await self.project_repo.get_paginated(
            status=status,
            location_id=location_id,
            search=search,
            page=page,
            limit=limit,
        )
        total_pages = max(1, math.ceil(total / limit))
        return PaginatedProjectsResponse(
            items=[_build_project_response(p) for p in projects],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_project(self, project_id: int) -> ProjectResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        return _build_project_response(project)

    async def create_project(self, current_user: User, body: ProjectCreate) -> ProjectResponse:
        data = body.model_dump()
        data["created_by"] = current_user.id
        project = await self.project_repo.create(data)
        project = await self.project_repo.get_by_id(project.id)
        return _build_project_response(project)

    async def update_project(
        self, current_user: User, project_id: int, body: ProjectUpdate
    ) -> ProjectResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        if current_user.role not in (UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetersiz yetki")

        updates = body.model_dump(exclude_unset=True)
        await self.project_repo.update(project, updates)
        project = await self.project_repo.get_by_id(project_id)
        return _build_project_response(project)

    async def delete_project(self, current_user: User, project_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        await self.project_repo.delete(project)

    async def require_project(self, project_id: int) -> ConstructionProject:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        return project

    async def update_progress(self, project_id: int, progress_pct: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if project:
            await self.project_repo.update(project, {"progress_pct": progress_pct})
