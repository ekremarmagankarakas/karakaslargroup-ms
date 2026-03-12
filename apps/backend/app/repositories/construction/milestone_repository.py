from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.milestone import ConstructionMilestone


class ConstructionMilestoneRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, milestone_id: int) -> ConstructionMilestone | None:
        result = await self.db.execute(
            select(ConstructionMilestone).where(ConstructionMilestone.id == milestone_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionMilestone]:
        result = await self.db.execute(
            select(ConstructionMilestone)
            .where(ConstructionMilestone.project_id == project_id)
            .order_by(ConstructionMilestone.created_at)
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> ConstructionMilestone:
        milestone = ConstructionMilestone(**data)
        self.db.add(milestone)
        await self.db.flush()
        await self.db.refresh(milestone)
        return milestone

    async def update(self, milestone: ConstructionMilestone, data: dict) -> ConstructionMilestone:
        for key, value in data.items():
            setattr(milestone, key, value)
        await self.db.flush()
        return milestone

    async def delete(self, milestone: ConstructionMilestone) -> None:
        await self.db.delete(milestone)
        await self.db.flush()

    async def get_avg_completion(self, project_id: int) -> int:
        result = await self.db.execute(
            select(func.avg(ConstructionMilestone.completion_pct)).where(
                ConstructionMilestone.project_id == project_id
            )
        )
        avg = result.scalar()
        return int(avg) if avg is not None else 0
