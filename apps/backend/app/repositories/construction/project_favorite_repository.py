from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.project_favorite import ConstructionProjectFavorite


class ConstructionProjectFavoriteRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_user_and_project(
        self, user_id: int, project_id: int
    ) -> ConstructionProjectFavorite | None:
        result = await self.db.execute(
            select(ConstructionProjectFavorite).where(
                ConstructionProjectFavorite.user_id == user_id,
                ConstructionProjectFavorite.project_id == project_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_ids_for_user(self, user_id: int) -> set[int]:
        result = await self.db.execute(
            select(ConstructionProjectFavorite.project_id).where(
                ConstructionProjectFavorite.user_id == user_id
            )
        )
        return set(result.scalars().all())

    async def get_favorited_project_ids(self, user_id: int) -> list[int]:
        result = await self.db.execute(
            select(ConstructionProjectFavorite.project_id).where(
                ConstructionProjectFavorite.user_id == user_id
            )
        )
        return list(result.scalars().all())

    async def add(self, user_id: int, project_id: int) -> ConstructionProjectFavorite:
        fav = ConstructionProjectFavorite(user_id=user_id, project_id=project_id)
        self.db.add(fav)
        await self.db.flush()
        return fav

    async def remove(self, fav: ConstructionProjectFavorite) -> None:
        await self.db.delete(fav)
        await self.db.flush()
