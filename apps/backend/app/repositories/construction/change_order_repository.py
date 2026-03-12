from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.change_order import ConstructionChangeOrder


class ConstructionChangeOrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, co_id: int) -> ConstructionChangeOrder | None:
        result = await self.db.execute(
            select(ConstructionChangeOrder)
            .options(
                joinedload(ConstructionChangeOrder.requester),
                joinedload(ConstructionChangeOrder.reviewer),
            )
            .where(ConstructionChangeOrder.id == co_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionChangeOrder]:
        result = await self.db.execute(
            select(ConstructionChangeOrder)
            .options(
                joinedload(ConstructionChangeOrder.requester),
                joinedload(ConstructionChangeOrder.reviewer),
            )
            .where(ConstructionChangeOrder.project_id == project_id)
            .order_by(ConstructionChangeOrder.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionChangeOrder:
        co = ConstructionChangeOrder(**data)
        self.db.add(co)
        await self.db.flush()
        await self.db.refresh(co)
        return co

    async def update(self, co: ConstructionChangeOrder, data: dict) -> ConstructionChangeOrder:
        for key, value in data.items():
            setattr(co, key, value)
        await self.db.flush()
        return co

    async def delete(self, co: ConstructionChangeOrder) -> None:
        await self.db.delete(co)
        await self.db.flush()
