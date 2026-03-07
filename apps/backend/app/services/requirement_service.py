from decimal import Decimal

from fastapi import BackgroundTasks, HTTPException, UploadFile, status

from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User, UserRole
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.image_repository import ImageRepository
from app.repositories.requirement_repository import RequirementRepository
from app.repositories.user_repository import UserRepository
from app.schemas.image import ImageResponse
from app.schemas.requirement import PaginatedRequirementsResponse, RequirementResponse
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
    ) -> None:
        self.req_repo = req_repo
        self.img_repo = img_repo
        self.fav_repo = fav_repo
        self.user_repo = user_repo
        self.storage = storage
        self.email = email

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
            paid=req.paid,
            approved_by=req.approved_by,
            approved_by_username=req.approver.username if req.approver else None,
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
    ) -> PaginatedRequirementsResponse:
        requirements, total = await self.req_repo.get_paginated(
            user_id=current_user.id,
            role=current_user.role,
            page=page,
            limit=limit,
            search=search,
            filter_user_id=filter_user_id,
            status=status,
            paid=paid,
            month=month,
            year=year,
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
    ) -> RequirementResponse:
        req = await self.req_repo.create(
            user_id=current_user.id,
            item_name=item_name,
            price=price,
            explanation=explanation,
        )
        # Re-fetch with relationships
        req = await self.req_repo.get_by_id(req.id)

        manager_emails = await self.user_repo.get_emails_by_roles(["manager", "admin"])
        background_tasks.add_task(
            self.email.send_new_requirement, req, current_user.username, manager_emails
        )

        return self._build_response(req, set())

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

        favorited_ids = await self.fav_repo.get_favorited_ids_for_user(current_user.id, [req.id])
        return self._build_response(req, favorited_ids)

    async def toggle_paid(self, requirement_id: int) -> None:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
        await self.req_repo.set_paid(req, not req.paid)

    async def delete_requirement(self, requirement_id: int) -> None:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
        await self.req_repo.delete(req)
