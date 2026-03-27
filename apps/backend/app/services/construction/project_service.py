import math

from fastapi import HTTPException, status

from app.models.construction.audit_log import ConstructionAuditAction
from app.models.construction.project import ConstructionProject
from app.models.user import User, UserRole
from app.repositories.construction.audit_log_repository import ConstructionAuditLogRepository
from app.repositories.construction.project_favorite_repository import (
    ConstructionProjectFavoriteRepository,
)
from app.repositories.construction.project_member_repository import ProjectMemberRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.project import (
    PaginatedProjectsResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)


def _build_project_response(
    project: ConstructionProject,
    favorite_ids: set[int] | None = None,
    team_counts: dict[int, int] | None = None,
) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        location_id=project.location_id,
        location_name=project.location.name if project.location else None,
        created_by=project.created_by,
        created_by_username=project.creator.username,
        status=project.status,
        project_type=project.project_type,
        start_date=project.start_date,
        end_date=project.end_date,
        budget=project.budget,
        progress_pct=project.progress_pct,
        created_at=project.created_at,
        is_favorite=project.id in favorite_ids if favorite_ids is not None else False,
        team_count=team_counts.get(project.id, 0) if team_counts is not None else 0,
    )


class ConstructionProjectService:
    def __init__(
        self,
        project_repo: ConstructionProjectRepository,
        audit_repo: ConstructionAuditLogRepository | None = None,
        favorite_repo: ConstructionProjectFavoriteRepository | None = None,
        member_repo: ProjectMemberRepository | None = None,
    ) -> None:
        self.project_repo = project_repo
        self.audit_repo = audit_repo
        self.favorite_repo = favorite_repo
        self.member_repo = member_repo

    async def list_projects(
        self,
        *,
        current_user_id: int | None = None,
        status: str | None = None,
        project_type: str | None = None,
        location_id: int | None = None,
        search: str | None = None,
        my_projects: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedProjectsResponse:
        # Resolve my_projects filter
        project_ids_filter: set[int] | None = None
        if my_projects and current_user_id is not None and self.member_repo is not None:
            project_ids_filter = await self.member_repo.get_project_ids_for_user(current_user_id)
            if not project_ids_filter:
                return PaginatedProjectsResponse(items=[], total=0, page=1, limit=limit, total_pages=1)

        projects, total = await self.project_repo.get_paginated(
            status=status,
            project_type=project_type,
            location_id=location_id,
            search=search,
            project_ids=project_ids_filter,
            page=page,
            limit=limit,
        )
        favorite_ids: set[int] = set()
        if self.favorite_repo and current_user_id is not None:
            favorite_ids = await self.favorite_repo.get_ids_for_user(current_user_id)
        pids = [p.id for p in projects]
        team_counts = await self.project_repo.get_team_counts(pids)
        total_pages = max(1, math.ceil(total / limit))
        return PaginatedProjectsResponse(
            items=[_build_project_response(p, favorite_ids, team_counts) for p in projects],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_project(self, project_id: int, current_user_id: int | None = None) -> ProjectResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        favorite_ids: set[int] = set()
        if self.favorite_repo and current_user_id is not None:
            favorite_ids = await self.favorite_repo.get_ids_for_user(current_user_id)
        team_counts = await self.project_repo.get_team_counts([project_id])
        return _build_project_response(project, favorite_ids, team_counts)

    async def create_project(self, current_user: User, body: ProjectCreate) -> ProjectResponse:
        data = body.model_dump()
        data["created_by"] = current_user.id
        project = await self.project_repo.create(data)
        if self.audit_repo:
            await self.audit_repo.create(
                {
                    "project_id": project.id,
                    "user_id": current_user.id,
                    "action": ConstructionAuditAction.created,
                    "field_name": None,
                    "old_value": None,
                    "new_value": body.name,
                }
            )
        project = await self.project_repo.get_by_id(project.id)
        return _build_project_response(project, {project.id} if project else set())

    async def update_project(
        self, current_user: User, project_id: int, body: ProjectUpdate
    ) -> ProjectResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        if current_user.role not in (UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetersiz yetki")

        updates = body.model_dump(exclude_unset=True)
        if self.audit_repo:
            for field, new_val in updates.items():
                old_val = getattr(project, field, None)
                if old_val == new_val:
                    continue
                if field == "status":
                    action = ConstructionAuditAction.status_changed
                elif field == "budget":
                    action = ConstructionAuditAction.budget_changed
                elif field == "progress_pct":
                    action = ConstructionAuditAction.progress_updated
                else:
                    action = ConstructionAuditAction.edited
                await self.audit_repo.create(
                    {
                        "project_id": project_id,
                        "user_id": current_user.id,
                        "action": action,
                        "field_name": field,
                        "old_value": str(old_val) if old_val is not None else None,
                        "new_value": str(new_val) if new_val is not None else None,
                    }
                )
        await self.project_repo.update(project, updates)
        project = await self.project_repo.get_by_id(project_id)
        favorite_ids: set[int] = set()
        if self.favorite_repo:
            favorite_ids = await self.favorite_repo.get_ids_for_user(current_user.id)
        return _build_project_response(project, favorite_ids)

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
