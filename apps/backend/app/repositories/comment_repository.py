from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.requirement_comment import RequirementComment


class CommentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_requirement(self, requirement_id: int) -> list[RequirementComment]:
        result = await self.db.execute(
            select(RequirementComment)
            .options(joinedload(RequirementComment.user))
            .where(RequirementComment.requirement_id == requirement_id)
            .order_by(RequirementComment.created_at)
        )
        return list(result.scalars().unique().all())

    async def create(self, requirement_id: int, user_id: int, body: str) -> RequirementComment:
        comment = RequirementComment(requirement_id=requirement_id, user_id=user_id, body=body)
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        # Re-fetch with user relationship
        result = await self.db.execute(
            select(RequirementComment)
            .options(joinedload(RequirementComment.user))
            .where(RequirementComment.id == comment.id)
        )
        return result.scalar_one()
