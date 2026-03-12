from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.photo import ConstructionPhoto


class ConstructionPhotoRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, photo_id: int) -> ConstructionPhoto | None:
        result = await self.db.execute(
            select(ConstructionPhoto)
            .options(joinedload(ConstructionPhoto.uploader))
            .where(ConstructionPhoto.id == photo_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionPhoto]:
        result = await self.db.execute(
            select(ConstructionPhoto)
            .options(joinedload(ConstructionPhoto.uploader))
            .where(ConstructionPhoto.project_id == project_id)
            .order_by(ConstructionPhoto.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionPhoto:
        photo = ConstructionPhoto(**data)
        self.db.add(photo)
        await self.db.flush()
        return await self.get_by_id(photo.id)  # type: ignore[return-value]

    async def delete(self, photo: ConstructionPhoto) -> None:
        await self.db.delete(photo)
        await self.db.flush()
