from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.repositories.construction.project_favorite_repository import (
    ConstructionProjectFavoriteRepository,
)
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.project import ProjectResponse
from app.services.construction.project_service import ConstructionProjectService
from app.repositories.construction.audit_log_repository import ConstructionAuditLogRepository

router = APIRouter()


@router.get("/favorites", response_model=list[ProjectResponse])
async def list_favorites(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    fav_repo = ConstructionProjectFavoriteRepository(db)
    project_ids = await fav_repo.get_favorited_project_ids(current_user.id)
    if not project_ids:
        return []
    project_repo = ConstructionProjectRepository(db)
    projects = []
    for pid in project_ids:
        p = await project_repo.get_by_id(pid)
        if p:
            projects.append(p)
    favorite_ids = set(project_ids)
    from app.services.construction.project_service import _build_project_response
    return [_build_project_response(p, favorite_ids) for p in projects]
