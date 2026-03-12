from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.core.config import get_settings
from app.repositories.procurement.favorite_repository import FavoriteRepository
from app.repositories.procurement.requirement_repository import RequirementRepository
from app.schemas.procurement.requirement import PaginatedRequirementsResponse
from app.services.procurement.favorite_service import FavoriteService
from app.services.storage_service import StorageService

router = APIRouter()


def _get_service(db: AsyncSession) -> FavoriteService:
    settings = get_settings()
    return FavoriteService(
        fav_repo=FavoriteRepository(db),
        req_repo=RequirementRepository(db),
        storage=StorageService(settings),
    )


@router.get("/", response_model=PaginatedRequirementsResponse)
async def list_favorites(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 10,
):
    service = _get_service(db)
    return await service.list_favorites(current_user, page, limit)


@router.post("/{requirement_id}", status_code=201)
async def add_favorite(
    requirement_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.add_favorite(current_user, requirement_id)
    return {"ok": True}


@router.delete("/{requirement_id}", status_code=204)
async def remove_favorite(
    requirement_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.remove_favorite(current_user, requirement_id)
