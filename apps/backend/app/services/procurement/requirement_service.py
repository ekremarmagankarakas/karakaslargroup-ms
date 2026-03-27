from datetime import datetime
from decimal import Decimal

from fastapi import BackgroundTasks, HTTPException, UploadFile, status

from app.models.audit_log import AuditAction
from app.models.procurement.requirement import Requirement, RequirementPriority, RequirementStatus
from app.models.user import User, UserRole
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.procurement.favorite_repository import FavoriteRepository
from app.repositories.procurement.image_repository import ImageRepository
from app.repositories.location_repository import LocationRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.procurement.comment_repository import CommentRepository
from app.repositories.procurement.requirement_repository import RequirementRepository
from app.repositories.user_repository import UserRepository
from app.schemas.image import ImageResponse
from app.schemas.procurement.requirement import (
    AuditLogResponse,
    CommentResponse,
    PaginatedRequirementsResponse,
    RequirementResponse,
)
from app.services.email_service import EmailService
from app.services.storage_service import StorageService


class RequirementService:
    def __init__(
        self,
        req_repo: RequirementRepository,
        img_repo: ImageRepository,
        fav_repo: FavoriteRepository,
        user_repo: UserRepository,
        storage: StorageService,
        email: EmailService,
        notif_repo: NotificationRepository | None = None,
        audit_repo: AuditLogRepository | None = None,
        location_repo: LocationRepository | None = None,
        comment_repo: CommentRepository | None = None,
    ) -> None:
        self.req_repo = req_repo
        self.img_repo = img_repo
        self.fav_repo = fav_repo
        self.user_repo = user_repo
        self.storage = storage
        self.email = email
        self.notif_repo = notif_repo
        self.audit_repo = audit_repo
        self.location_repo = location_repo
        self.comment_repo = comment_repo

    def _build_response(self, req: Requirement, favorited_ids: set[int]) -> RequirementResponse:
        images = [
            ImageResponse(
                id=img.id,
                s3_key=img.s3_key,
                original_filename=img.original_filename,
                file_type=img.file_type,
                url=self.storage.get_presigned_url(img.s3_key),
            )
            for img in req.images
        ]
        return RequirementResponse(
            id=req.id,
            user_id=req.user_id,
            username=req.user.username,
            item_name=req.item_name,
            price=req.price,
            explanation=req.explanation,
            status=req.status,
            priority=req.priority,
            needed_by=req.needed_by,
            paid=req.paid,
            approved_by=req.approved_by,
            approved_by_username=req.approver.username if req.approver else None,
            location_id=req.location_id,
            location_name=req.location.name if req.location else None,
            category_id=req.category_id,
            category_name=req.category.name if req.category else None,
            category_color=req.category.color if req.category else None,
            images=images,
            is_favorited=req.id in favorited_ids,
            created_at=req.created_at,
        )

    async def list_requirements(
        self,
        current_user: User,
        page: int,
        limit: int,
        search: str | None,
        filter_user_id: int | None,
        status: RequirementStatus | None,
        paid: bool | None,
        month: int | None,
        year: int | None,
        location_id: int | None = None,
        priority: RequirementPriority | None = None,
        category_id: int | None = None,
    ) -> PaginatedRequirementsResponse:
        # Resolve manager's location scope
        manager_location_ids: list[int] | None = None
        if current_user.role == UserRole.manager and self.location_repo:
            manager_location_ids = await self.location_repo.get_location_ids_for_user(current_user.id)

        requirements, total = await self.req_repo.get_paginated(
            user_id=current_user.id,
            role=current_user.role,
            page=page,
            limit=limit,
            search=search,
            filter_user_id=filter_user_id,
            status=status,
            priority=priority,
            paid=paid,
            month=month,
            year=year,
            location_id=location_id,
            category_id=category_id,
            manager_location_ids=manager_location_ids,
        )

        req_ids = [r.id for r in requirements]
        favorited_ids = await self.fav_repo.get_favorited_ids_for_user(current_user.id, req_ids)

        items = [self._build_response(req, favorited_ids) for req in requirements]
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return PaginatedRequirementsResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def create_requirement(
        self,
        current_user: User,
        item_name: str,
        price: Decimal,
        explanation: str | None,
        background_tasks: BackgroundTasks,
        location_id: int | None = None,
        priority: RequirementPriority = RequirementPriority.normal,
        needed_by: "datetime | None" = None,
        category_id: int | None = None,
    ) -> RequirementResponse:
        # Auto-fill location from user's first assignment if not specified
        if location_id is None and self.location_repo:
            user_loc_ids = await self.location_repo.get_location_ids_for_user(current_user.id)
            if user_loc_ids:
                location_id = user_loc_ids[0]

        req = await self.req_repo.create(
            user_id=current_user.id,
            item_name=item_name,
            price=price,
            explanation=explanation,
            location_id=location_id,
            priority=priority,
            needed_by=needed_by,
            category_id=category_id,
        )
        # Re-fetch with relationships
        req = await self.req_repo.get_by_id(req.id)

        manager_emails = await self.user_repo.get_emails_by_roles(["manager", "admin"])
        background_tasks.add_task(
            self.email.send_new_requirement, req, current_user.username, manager_emails
        )

        # Audit log
        if self.audit_repo:
            await self.audit_repo.create(req.id, current_user.id, AuditAction.created, new_value=item_name)

        # Notify managers/admins — prefer location-scoped managers if possible
        if self.notif_repo:
            if location_id and self.location_repo:
                manager_users = await self.location_repo.get_users_for_location(location_id)
                # Filter to only managers/admins
                from app.models.user import UserRole as _UserRole
                manager_users = [u for u in manager_users if u.role in (_UserRole.manager, _UserRole.admin)]
                if not manager_users:
                    manager_users = await self.user_repo.get_users_by_roles(["manager", "admin"])
            else:
                manager_users = await self.user_repo.get_users_by_roles(["manager", "admin"])
            for mgr in manager_users:
                await self.notif_repo.create(
                    user_id=mgr.id,
                    message=f"{current_user.username} yeni bir talep oluşturdu: {item_name}",
                    requirement_id=req.id,
                )

        return self._build_response(req, set())

    async def update_requirement(
        self,
        requirement_id: int,
        current_user: User,
        item_name: str | None,
        price: Decimal | None,
        explanation: str | None,
        priority: RequirementPriority | None = None,
        needed_by: "datetime | None" = None,
        clear_needed_by: bool = False,
        category_id: int | None = None,
        clear_category: bool = False,
    ) -> RequirementResponse:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")

        if current_user.role != UserRole.admin and req.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

        if req.status != RequirementStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requirements can be edited")

        old_values = f"item_name={req.item_name}, price={req.price}"
        await self.req_repo.update_fields(
            req, item_name, price, explanation,
            priority=priority,
            needed_by=needed_by,
            category_id=category_id,
            clear_needed_by=clear_needed_by,
            clear_category=clear_category,
        )
        req = await self.req_repo.get_by_id(req.id)

        if self.audit_repo:
            new_values = f"item_name={req.item_name}, price={req.price}"
            await self.audit_repo.create(req.id, current_user.id, AuditAction.edited, old_value=old_values, new_value=new_values)

        favorited_ids = await self.fav_repo.get_favorited_ids_for_user(current_user.id, [req.id])
        return self._build_response(req, favorited_ids)

    async def upload_images(
        self, requirement_id: int, current_user: User, files: list[UploadFile]
    ) -> list[ImageResponse]:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")

        if current_user.role != UserRole.admin and req.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

        results = []
        for file in files:
            try:
                s3_key, file_type = await self.storage.upload_file(file, requirement_id)
            except ValueError as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

            img = await self.img_repo.create(
                requirement_id=requirement_id,
                s3_key=s3_key,
                original_filename=file.filename or "upload",
                file_type=file_type,
            )
            results.append(
                ImageResponse(
                    id=img.id,
                    s3_key=img.s3_key,
                    original_filename=img.original_filename,
                    file_type=img.file_type,
                    url=self.storage.get_presigned_url(img.s3_key),
                )
            )
        return results

    async def update_status(
        self,
        requirement_id: int,
        new_status: RequirementStatus,
        current_user: User,
        background_tasks: BackgroundTasks,
    ) -> RequirementResponse:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")

        # Toggle logic
        if new_status == RequirementStatus.accepted:
            if req.status == RequirementStatus.accepted:
                final_status = RequirementStatus.pending
                approved_by = None
            else:
                final_status = RequirementStatus.accepted
                approved_by = current_user.id
        else:  # declined
            if req.status == RequirementStatus.declined:
                final_status = RequirementStatus.pending
                approved_by = None
            else:
                final_status = RequirementStatus.declined
                approved_by = current_user.id

        await self.req_repo.update_status(req, final_status, approved_by)
        # Re-fetch with relationships eagerly loaded (avoid async lazy-load errors)
        req = await self.req_repo.get_by_id(req.id)

        # Email owner always; additionally email accountants if accepted
        owner = await self.user_repo.get_by_id(req.user_id)
        recipients = [owner.email] if owner else []
        if final_status == RequirementStatus.accepted:
            accountant_emails = await self.user_repo.get_emails_by_roles(["accountant"])
            recipients = list(set(recipients + accountant_emails))

        background_tasks.add_task(
            self.email.send_status_update, req, final_status.value, recipients
        )

        # Audit log
        if self.audit_repo:
            old_status = new_status.value if final_status == RequirementStatus.pending else "pending"
            await self.audit_repo.create(
                req.id, current_user.id, AuditAction.status_changed,
                old_value=old_status, new_value=final_status.value
            )

        # Notify owner
        if self.notif_repo and owner:
            STATUS_LABELS = {"accepted": "onaylandı", "declined": "reddedildi", "pending": "beklemede"}
            label = STATUS_LABELS.get(final_status.value, final_status.value)
            await self.notif_repo.create(
                user_id=owner.id,
                message=f'"{req.item_name}" talebiniz {label}.',
                requirement_id=req.id,
            )

        favorited_ids = await self.fav_repo.get_favorited_ids_for_user(current_user.id, [req.id])
        return self._build_response(req, favorited_ids)

    async def toggle_paid(self, requirement_id: int, current_user: User) -> None:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
        old_val = str(req.paid)
        await self.req_repo.set_paid(req, not req.paid)
        if self.audit_repo:
            await self.audit_repo.create(
                requirement_id, current_user.id, AuditAction.paid_toggled,
                old_value=old_val, new_value=str(not req.paid)
            )

    async def delete_requirement(self, requirement_id: int, current_user: User) -> None:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
        if self.audit_repo:
            await self.audit_repo.create(requirement_id, current_user.id, AuditAction.deleted, old_value=req.item_name)
        await self.req_repo.delete(req)

    async def bulk_update_status(
        self,
        ids: list[int],
        new_status: RequirementStatus,
        current_user: User,
        background_tasks: BackgroundTasks,
    ) -> list[RequirementResponse]:
        results = []
        for req_id in ids:
            try:
                resp = await self.update_status(req_id, new_status, current_user, background_tasks)
                results.append(resp)
            except HTTPException:
                pass
        return results

    async def list_comments(self, requirement_id: int) -> list[CommentResponse]:
        if not self.comment_repo:
            return []
        comments = await self.comment_repo.get_by_requirement(requirement_id)
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

    async def create_comment(self, requirement_id: int, user_id: int, body: str) -> CommentResponse:
        if not self.comment_repo:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Comment service unavailable")
        comment = await self.comment_repo.create(requirement_id=requirement_id, user_id=user_id, body=body)
        return CommentResponse(
            id=comment.id,
            requirement_id=comment.requirement_id,
            user_id=comment.user_id,
            username=comment.user.username,
            body=comment.body,
            created_at=comment.created_at,
        )

    async def get_audit_log(self, requirement_id: int) -> list[AuditLogResponse]:
        if not self.audit_repo:
            return []
        logs = await self.audit_repo.get_for_requirement(requirement_id)
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
