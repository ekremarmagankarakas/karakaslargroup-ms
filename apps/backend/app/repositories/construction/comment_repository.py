from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.comment import ConstructionComment


class ConstructionCommentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, comment_id: int) -> ConstructionComment | None:
        result = await self.db.execute(
            select(ConstructionComment)
            .options(joinedload(ConstructionComment.user))
            .where(ConstructionComment.id == comment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionComment]:
        result = await self.db.execute(
            select(ConstructionComment)
            .options(joinedload(ConstructionComment.user))
            .where(ConstructionComment.project_id == project_id)
            .order_by(ConstructionComment.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionComment:
        comment = ConstructionComment(**data)
        self.db.add(comment)
        await self.db.flush()
        return await self.get_by_id(comment.id)  # type: ignore[return-value]

    async def delete(self, comment: ConstructionComment) -> None:
        await self.db.delete(comment)
        await self.db.flush()
