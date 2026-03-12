from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.core.config import get_settings
from app.repositories.construction.photo_repository import ConstructionPhotoRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.photo import PhotoResponse
from app.services.construction.photo_service import ConstructionPhotoService
from app.services.storage_service import StorageService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionPhotoService:
    return ConstructionPhotoService(
        photo_repo=ConstructionPhotoRepository(db),
        project_repo=ConstructionProjectRepository(db),
        storage=StorageService(get_settings()),
    )


@router.get("/{project_id}/photos", response_model=list[PhotoResponse])
async def list_photos(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_photos(project_id)


@router.post("/{project_id}/photos", response_model=PhotoResponse, status_code=201)
async def upload_photo(
    project_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    caption: str | None = Form(None),
):
    return await _get_service(db).upload_photo(current_user, project_id, file, caption)


@router.delete("/{project_id}/photos/{photo_id}", status_code=204)
async def delete_photo(
    project_id: int,
    photo_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_photo(current_user, project_id, photo_id)
