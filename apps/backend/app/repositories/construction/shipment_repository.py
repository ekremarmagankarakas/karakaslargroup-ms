from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.shipment import ConstructionShipment, ShipmentStatus


class ShipmentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, shipment_id: int) -> ConstructionShipment | None:
        result = await self.db.execute(
            select(ConstructionShipment)
            .options(joinedload(ConstructionShipment.receiver))
            .where(ConstructionShipment.id == shipment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(
        self,
        project_id: int,
        status: str | None = None,
        material_id: int | None = None,
    ) -> list[ConstructionShipment]:
        query = (
            select(ConstructionShipment)
            .options(joinedload(ConstructionShipment.receiver))
            .where(ConstructionShipment.project_id == project_id)
        )
        if status:
            query = query.where(ConstructionShipment.status == status)
        if material_id:
            query = query.where(ConstructionShipment.material_id == material_id)
        query = query.order_by(ConstructionShipment.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_material(self, material_id: int) -> list[ConstructionShipment]:
        result = await self.db.execute(
            select(ConstructionShipment)
            .options(joinedload(ConstructionShipment.receiver))
            .where(ConstructionShipment.material_id == material_id)
            .order_by(ConstructionShipment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_pending_all(self) -> list[ConstructionShipment]:
        """Cross-project query of ordered + in_transit shipments."""
        result = await self.db.execute(
            select(ConstructionShipment)
            .options(joinedload(ConstructionShipment.receiver))
            .where(
                ConstructionShipment.status.in_(
                    [ShipmentStatus.ordered, ShipmentStatus.in_transit]
                )
            )
            .order_by(ConstructionShipment.expected_delivery_date.asc().nulls_last())
        )
        return list(result.scalars().all())

    async def count_pending(self) -> int:
        from sqlalchemy import func
        result = await self.db.scalar(
            select(func.count()).select_from(ConstructionShipment).where(
                ConstructionShipment.status.in_(
                    [ShipmentStatus.ordered, ShipmentStatus.in_transit]
                )
            )
        )
        return result or 0

    async def create(self, data: dict) -> ConstructionShipment:
        shipment = ConstructionShipment(**data)
        self.db.add(shipment)
        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def update(self, shipment: ConstructionShipment, data: dict) -> ConstructionShipment:
        for key, value in data.items():
            setattr(shipment, key, value)
        await self.db.flush()
        return shipment

    async def delete(self, shipment: ConstructionShipment) -> None:
        await self.db.delete(shipment)
        await self.db.flush()
