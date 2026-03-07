from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.favorite import Favorite
from app.models.requirement import Requirement


class FavoriteRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, user_id: int, requirement_id: int) -> Favorite | None:
        result = await self.db.execute(
            select(Favorite).where(
                Favorite.user_id == user_id,
                Favorite.requirement_id == requirement_id,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, user_id: int, requirement_id: int) -> Favorite:
        fav = Favorite(user_id=user_id, requirement_id=requirement_id)
        self.db.add(fav)
        await self.db.commit()
        await self.db.refresh(fav)
        return fav

    async def remove(self, fav: Favorite) -> None:
        await self.db.delete(fav)
        await self.db.commit()

    async def get_favorited_ids_for_user(self, user_id: int, requirement_ids: list[int]) -> set[int]:
        if not requirement_ids:
            return set()
        result = await self.db.execute(
            select(Favorite.requirement_id).where(
                Favorite.user_id == user_id,
                Favorite.requirement_id.in_(requirement_ids),
            )
        )
        return set(result.scalars().all())

    async def get_paginated_for_user(
        self, user_id: int, page: int, limit: int
    ) -> tuple[list[Favorite], int]:
        count_result = await self.db.execute(
            select(func.count()).where(Favorite.user_id == user_id)
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Favorite)
            .options(
                joinedload(Favorite.requirement).options(
                    joinedload(Requirement.user),
                    joinedload(Requirement.approver),
                    selectinload(Requirement.images),
                )
            )
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        items = list(result.scalars().unique().all())
        return items, total
