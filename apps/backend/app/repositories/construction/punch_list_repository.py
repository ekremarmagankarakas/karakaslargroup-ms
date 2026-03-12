from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.punch_list_item import ConstructionPunchListItem, PunchListStatus


class PunchListRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self):
        return (
            select(ConstructionPunchListItem)
            .options(
                joinedload(ConstructionPunchListItem.subcontractor),
                joinedload(ConstructionPunchListItem.assignee),
                joinedload(ConstructionPunchListItem.verifier),
                joinedload(ConstructionPunchListItem.creator),
            )
        )

    async def get_by_id(self, item_id: int) -> ConstructionPunchListItem | None:
        result = await self.db.execute(
            self._base_query().where(ConstructionPunchListItem.id == item_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_project(self, project_id: int, status: PunchListStatus | None = None) -> list[ConstructionPunchListItem]:
        q = self._base_query().where(ConstructionPunchListItem.project_id == project_id)
        if status:
            q = q.where(ConstructionPunchListItem.status == status)
        q = q.order_by(ConstructionPunchListItem.created_at.desc())
        result = await self.db.execute(q)
        return list(result.scalars().unique().all())

    async def get_open_count(self, project_id: int) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(ConstructionPunchListItem)
            .where(
                ConstructionPunchListItem.project_id == project_id,
                ConstructionPunchListItem.status.not_in([PunchListStatus.verified]),
            )
        )
        return result.scalar_one()

    async def create(self, data: dict) -> ConstructionPunchListItem:
        item = ConstructionPunchListItem(**data)
        self.db.add(item)
        await self.db.flush()
        return (await self.get_by_id(item.id))  # type: ignore[return-value]

    async def update(self, item: ConstructionPunchListItem, data: dict) -> ConstructionPunchListItem:
        for key, value in data.items():
            setattr(item, key, value)
        await self.db.flush()
        return item

    async def delete(self, item: ConstructionPunchListItem) -> None:
        await self.db.delete(item)
        await self.db.flush()
