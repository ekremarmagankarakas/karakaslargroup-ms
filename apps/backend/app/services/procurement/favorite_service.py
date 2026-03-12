from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.procurement.favorite_repository import FavoriteRepository
from app.repositories.procurement.requirement_repository import RequirementRepository
from app.schemas.image import ImageResponse
from app.schemas.procurement.requirement import PaginatedRequirementsResponse, RequirementResponse
from app.services.storage_service import StorageService


class FavoriteService:
    def __init__(
        self,
        fav_repo: FavoriteRepository,
        req_repo: RequirementRepository,
        storage: StorageService,
    ) -> None:
        self.fav_repo = fav_repo
        self.req_repo = req_repo
        self.storage = storage

    def _build_req_response(self, req: object, is_favorited: bool) -> RequirementResponse:
        from app.models.procurement.requirement import Requirement
        r: Requirement = req  # type: ignore
        images = [
            ImageResponse(
                id=img.id,
                s3_key=img.s3_key,
                original_filename=img.original_filename,
                file_type=img.file_type,
                url=self.storage.get_presigned_url(img.s3_key),
            )
            for img in r.images
        ]
        return RequirementResponse(
            id=r.id,
            user_id=r.user_id,
            username=r.user.username,
            item_name=r.item_name,
            price=r.price,
            explanation=r.explanation,
            status=r.status,
            paid=r.paid,
            approved_by=r.approved_by,
            approved_by_username=r.approver.username if r.approver else None,
            images=images,
            is_favorited=is_favorited,
            created_at=r.created_at,
        )

    async def add_favorite(self, current_user: User, requirement_id: int) -> None:
        req = await self.req_repo.get_by_id(requirement_id)
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requirement not found")
        existing = await self.fav_repo.get(current_user.id, requirement_id)
        if existing:
            return  # already favorited, idempotent
        await self.fav_repo.add(current_user.id, requirement_id)

    async def remove_favorite(self, current_user: User, requirement_id: int) -> None:
        fav = await self.fav_repo.get(current_user.id, requirement_id)
        if not fav:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
        await self.fav_repo.remove(fav)

    async def list_favorites(
        self, current_user: User, page: int, limit: int
    ) -> PaginatedRequirementsResponse:
        favorites, total = await self.fav_repo.get_paginated_for_user(current_user.id, page, limit)
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        items = [self._build_req_response(fav.requirement, True) for fav in favorites]
        return PaginatedRequirementsResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
