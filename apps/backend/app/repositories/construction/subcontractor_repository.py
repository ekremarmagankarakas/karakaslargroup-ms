from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.subcontractor import ConstructionSubcontractor


class ConstructionSubcontractorRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, sub_id: int) -> ConstructionSubcontractor | None:
        result = await self.db.execute(
            select(ConstructionSubcontractor).where(ConstructionSubcontractor.id == sub_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionSubcontractor]:
        result = await self.db.execute(
            select(ConstructionSubcontractor)
            .where(ConstructionSubcontractor.project_id == project_id)
            .order_by(ConstructionSubcontractor.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> ConstructionSubcontractor:
        sub = ConstructionSubcontractor(**data)
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def update(self, sub: ConstructionSubcontractor, data: dict) -> ConstructionSubcontractor:
        for key, value in data.items():
            setattr(sub, key, value)
        await self.db.flush()
        return sub

    async def delete(self, sub: ConstructionSubcontractor) -> None:
        await self.db.delete(sub)
        await self.db.flush()
