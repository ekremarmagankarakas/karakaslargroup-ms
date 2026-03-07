from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requirement_image import RequirementImage


class ImageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        requirement_id: int,
        s3_key: str,
        original_filename: str,
        file_type: str,
    ) -> RequirementImage:
        img = RequirementImage(
            requirement_id=requirement_id,
            s3_key=s3_key,
            original_filename=original_filename,
            file_type=file_type,
        )
        self.db.add(img)
        await self.db.commit()
        await self.db.refresh(img)
        return img

    async def get_by_requirement(self, requirement_id: int) -> list[RequirementImage]:
        result = await self.db.execute(
            select(RequirementImage).where(RequirementImage.requirement_id == requirement_id)
        )
        return list(result.scalars().all())

    async def delete(self, image: RequirementImage) -> None:
        await self.db.delete(image)
        await self.db.commit()
