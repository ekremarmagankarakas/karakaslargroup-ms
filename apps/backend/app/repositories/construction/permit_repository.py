from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.permit import ConstructionPermit


class ConstructionPermitRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, permit_id: int) -> ConstructionPermit | None:
        result = await self.db.execute(
            select(ConstructionPermit).where(ConstructionPermit.id == permit_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionPermit]:
        result = await self.db.execute(
            select(ConstructionPermit)
            .where(ConstructionPermit.project_id == project_id)
            .order_by(ConstructionPermit.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> ConstructionPermit:
        permit = ConstructionPermit(**data)
        self.db.add(permit)
        await self.db.flush()
        await self.db.refresh(permit)
        return permit

    async def update(self, permit: ConstructionPermit, data: dict) -> ConstructionPermit:
        for key, value in data.items():
            setattr(permit, key, value)
        await self.db.flush()
        return permit

    async def delete(self, permit: ConstructionPermit) -> None:
        await self.db.delete(permit)
        await self.db.flush()
