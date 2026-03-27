from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.project_member_repository import ProjectMemberRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.project_member import (
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectMemberUpdate,
)
from app.schemas.construction.project import PaginatedProjectsResponse
from app.services.construction.project_member_service import ProjectMemberService
from app.repositories.construction.project_favorite_repository import ConstructionProjectFavoriteRepository

router = APIRouter()


def _get_service(db: AsyncSession) -> ProjectMemberService:
    return ProjectMemberService(
        member_repo=ProjectMemberRepository(db),
        project_repo=ConstructionProjectRepository(db),
        db=db,
    )


@router.get("/my-projects", response_model=PaginatedProjectsResponse)
async def get_my_projects(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Projects where the current user is a team member."""
    service = _get_service(db)
    project_ids = await service.get_user_projects_ids(current_user.id)

    if not project_ids:
        return PaginatedProjectsResponse(items=[], total=0, page=1, limit=100, total_pages=1)

    project_repo = ConstructionProjectRepository(db)
    favorite_repo = ConstructionProjectFavoriteRepository(db)
    projects = await project_repo.get_by_ids(list(project_ids))
    favorite_ids = await favorite_repo.get_ids_for_user(current_user.id)

    from app.services.construction.project_service import _build_project_response
    items = [_build_project_response(p, favorite_ids) for p in projects]
    return PaginatedProjectsResponse(
        items=items, total=len(items), page=1, limit=len(items) or 1, total_pages=1
    )


@router.get("/team/count")
async def get_total_team_count(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Total team member count across all projects."""
    service = _get_service(db)
    count = await service.count_members()
    return {"count": count}


@router.get("/{project_id}/team", response_model=list[ProjectMemberResponse])
async def list_team(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.list_members(project_id)


@router.post("/{project_id}/team", response_model=ProjectMemberResponse, status_code=201)
async def add_team_member(
    project_id: int,
    body: ProjectMemberCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.add_member(project_id, body)


@router.patch("/{project_id}/team/{member_id}", response_model=ProjectMemberResponse)
async def update_team_member(
    project_id: int,
    member_id: int,
    body: ProjectMemberUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_member(project_id, member_id, body)


@router.delete("/{project_id}/team/{member_id}", status_code=204)
async def remove_team_member(
    project_id: int,
    member_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.remove_member(project_id, member_id)
