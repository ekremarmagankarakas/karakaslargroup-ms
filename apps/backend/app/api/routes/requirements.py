from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AccountantDep, AdminOnly, CurrentUser, EmployeeDep, ManagerOrAdmin, get_db
from app.core.config import get_settings
from app.models.requirement import RequirementStatus
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.image_repository import ImageRepository
from app.repositories.requirement_repository import RequirementRepository
from app.repositories.user_repository import UserRepository
from app.schemas.image import ImageResponse
from app.schemas.requirement import (
    PaginatedRequirementsResponse,
    RequirementCreate,
    RequirementResponse,
    RequirementStatusUpdate,
)
from app.services.email_service import EmailService
from app.services.requirement_service import RequirementService
from app.services.storage_service import StorageService

router = APIRouter()


def _get_service(db: AsyncSession) -> RequirementService:
    settings = get_settings()
    return RequirementService(
        req_repo=RequirementRepository(db),
        img_repo=ImageRepository(db),
        fav_repo=FavoriteRepository(db),
        user_repo=UserRepository(db),
        storage=StorageService(settings),
        email=EmailService(),
    )


@router.get("/", response_model=PaginatedRequirementsResponse)
async def list_requirements(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    user_id: int | None = None,
    status: RequirementStatus | None = None,
    paid: bool | None = None,
    month: int | None = None,
    year: int | None = None,
):
    service = _get_service(db)
    return await service.list_requirements(
        current_user=current_user,
        page=page,
        limit=limit,
        search=search,
        filter_user_id=user_id,
        status=status,
        paid=paid,
        month=month,
        year=year,
    )


@router.post("/", response_model=RequirementResponse, status_code=201)
async def create_requirement(
    body: RequirementCreate,
    current_user: EmployeeDep,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.create_requirement(
        current_user=current_user,
        item_name=body.item_name,
        price=body.price,
        explanation=body.explanation,
        background_tasks=background_tasks,
    )


@router.post("/{requirement_id}/images", response_model=list[ImageResponse])
async def upload_images(
    requirement_id: int,
    current_user: EmployeeDep,
    db: Annotated[AsyncSession, Depends(get_db)],
    files: list[UploadFile] = File(...),
):
    service = _get_service(db)
    return await service.upload_images(requirement_id, current_user, files)


@router.patch("/{requirement_id}/status", response_model=RequirementResponse)
async def update_status(
    requirement_id: int,
    body: RequirementStatusUpdate,
    current_user: ManagerOrAdmin,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_status(
        requirement_id=requirement_id,
        new_status=RequirementStatus(body.status),
        current_user=current_user,
        background_tasks=background_tasks,
    )


@router.patch("/{requirement_id}/paid", status_code=204)
async def toggle_paid(
    requirement_id: int,
    _: AccountantDep,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.toggle_paid(requirement_id)


@router.delete("/{requirement_id}", status_code=204)
async def delete_requirement(
    requirement_id: int,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_requirement(requirement_id)
