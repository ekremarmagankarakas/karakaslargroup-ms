import csv
import io
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AccountantDep, AdminOnly, CurrentUser, EmployeeDep, ManagerOrAdmin, ManagerOrAccountantOrAdmin, get_db
from app.core.config import get_settings
from app.models.requirement import RequirementPriority, RequirementStatus
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.image_repository import ImageRepository
from app.repositories.location_repository import LocationRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.requirement_repository import RequirementRepository
from app.repositories.user_repository import UserRepository
from app.schemas.image import ImageResponse
from app.schemas.requirement import (
    AuditLogResponse,
    BulkStatusUpdate,
    CommentCreate,
    CommentResponse,
    PaginatedRequirementsResponse,
    RequirementCreate,
    RequirementResponse,
    RequirementStatusUpdate,
    RequirementUpdate,
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
        notif_repo=NotificationRepository(db),
        audit_repo=AuditLogRepository(db),
        location_repo=LocationRepository(db),
    )


# --- Static paths first (must come before /{requirement_id} to avoid conflicts) ---

@router.get("/export")
async def export_requirements(
    current_user: ManagerOrAccountantOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = None,
    user_id: int | None = None,
    status: RequirementStatus | None = None,
    priority: RequirementPriority | None = None,
    paid: bool | None = None,
    month: int | None = None,
    year: int | None = None,
    location_id: int | None = None,
    category_id: int | None = None,
):
    service = _get_service(db)
    paginated = await service.list_requirements(
        current_user=current_user,
        page=1,
        limit=10000,
        search=search,
        filter_user_id=user_id,
        status=status,
        priority=priority,
        paid=paid,
        month=month,
        year=year,
        location_id=location_id,
        category_id=category_id,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Ürün", "Kullanıcı", "Fiyat", "Durum", "Onaylayan", "Ödeme", "Tarih"])
    STATUS_LABELS = {"pending": "Beklemede", "accepted": "Onaylandı", "declined": "Reddedildi"}
    for req in paginated.items:
        writer.writerow([
            req.id,
            req.item_name,
            req.username,
            str(req.price),
            STATUS_LABELS.get(req.status, req.status),
            req.approved_by_username or "",
            "Ödendi" if req.paid else "Ödenmedi",
            req.created_at.strftime("%Y-%m-%d %H:%M") if req.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=talepler.csv"},
    )


@router.patch("/bulk-status", response_model=list[RequirementResponse])
async def bulk_update_status(
    body: BulkStatusUpdate,
    current_user: ManagerOrAdmin,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.bulk_update_status(
        ids=body.ids,
        new_status=RequirementStatus(body.status),
        current_user=current_user,
        background_tasks=background_tasks,
    )


# --- Collection routes ---

@router.get("/", response_model=PaginatedRequirementsResponse)
async def list_requirements(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    user_id: int | None = None,
    status: RequirementStatus | None = None,
    priority: RequirementPriority | None = None,
    paid: bool | None = None,
    month: int | None = None,
    year: int | None = None,
    location_id: int | None = None,
    category_id: int | None = None,
):
    service = _get_service(db)
    return await service.list_requirements(
        current_user=current_user,
        page=page,
        limit=limit,
        search=search,
        filter_user_id=user_id,
        status=status,
        priority=priority,
        paid=paid,
        month=month,
        year=year,
        location_id=location_id,
        category_id=category_id,
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
        location_id=body.location_id,
        priority=body.priority,
        needed_by=body.needed_by,
        category_id=body.category_id,
    )


# --- Item routes ---

@router.patch("/{requirement_id}", response_model=RequirementResponse)
async def update_requirement(
    requirement_id: int,
    body: RequirementUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_requirement(
        requirement_id=requirement_id,
        current_user=current_user,
        item_name=body.item_name,
        price=body.price,
        explanation=body.explanation,
        priority=body.priority,
        needed_by=body.needed_by,
        category_id=body.category_id,
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
    current_user: AccountantDep,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.toggle_paid(requirement_id, current_user)


@router.delete("/{requirement_id}", status_code=204)
async def delete_requirement(
    requirement_id: int,
    current_user: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_requirement(requirement_id, current_user)


@router.get("/{requirement_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    requirement_id: int,
    _: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = CommentRepository(db)
    comments = await repo.get_by_requirement(requirement_id)
    return [
        CommentResponse(
            id=c.id,
            requirement_id=c.requirement_id,
            user_id=c.user_id,
            username=c.user.username,
            body=c.body,
            created_at=c.created_at,
        )
        for c in comments
    ]


@router.post("/{requirement_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    requirement_id: int,
    body: CommentCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = CommentRepository(db)
    comment = await repo.create(requirement_id=requirement_id, user_id=current_user.id, body=body.body)
    return CommentResponse(
        id=comment.id,
        requirement_id=comment.requirement_id,
        user_id=comment.user_id,
        username=comment.user.username,
        body=comment.body,
        created_at=comment.created_at,
    )


@router.get("/{requirement_id}/audit", response_model=list[AuditLogResponse])
async def get_audit_log(
    requirement_id: int,
    _: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = AuditLogRepository(db)
    logs = await repo.get_for_requirement(requirement_id)
    return [
        AuditLogResponse(
            id=log.id,
            requirement_id=log.requirement_id,
            actor_id=log.actor_id,
            actor_username=log.actor.username,
            action=log.action.value,
            old_value=log.old_value,
            new_value=log.new_value,
            created_at=log.created_at,
        )
        for log in logs
    ]
