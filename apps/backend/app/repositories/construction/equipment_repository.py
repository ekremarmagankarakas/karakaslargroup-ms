from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.equipment import ConstructionEquipment


class EquipmentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self):
        return (
            select(ConstructionEquipment)
            .options(joinedload(ConstructionEquipment.creator))
        )

    async def get_by_id(self, equipment_id: int) -> ConstructionEquipment | None:
        result = await self.db.execute(
            self._base_query().where(ConstructionEquipment.id == equipment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionEquipment]:
        result = await self.db.execute(
            self._base_query()
            .where(ConstructionEquipment.project_id == project_id)
            .order_by(ConstructionEquipment.name)
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionEquipment:
        equipment = ConstructionEquipment(**data)
        self.db.add(equipment)
        await self.db.flush()
        return (await self.get_by_id(equipment.id))  # type: ignore[return-value]

    async def update(self, equipment: ConstructionEquipment, data: dict) -> ConstructionEquipment:
        for key, value in data.items():
            setattr(equipment, key, value)
        await self.db.flush()
        return equipment

    async def delete(self, equipment: ConstructionEquipment) -> None:
        await self.db.delete(equipment)
        await self.db.flush()
