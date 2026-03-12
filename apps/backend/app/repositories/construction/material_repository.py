from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.material import ConstructionMaterial


class ConstructionMaterialRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, material_id: int) -> ConstructionMaterial | None:
        result = await self.db.execute(
            select(ConstructionMaterial).where(ConstructionMaterial.id == material_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionMaterial]:
        result = await self.db.execute(
            select(ConstructionMaterial)
            .where(ConstructionMaterial.project_id == project_id)
            .order_by(ConstructionMaterial.created_at)
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> ConstructionMaterial:
        material = ConstructionMaterial(**data)
        self.db.add(material)
        await self.db.flush()
        await self.db.refresh(material)
        return material

    async def update(self, material: ConstructionMaterial, data: dict) -> ConstructionMaterial:
        for key, value in data.items():
            setattr(material, key, value)
        await self.db.flush()
        return material

    async def delete(self, material: ConstructionMaterial) -> None:
        await self.db.delete(material)
        await self.db.flush()
