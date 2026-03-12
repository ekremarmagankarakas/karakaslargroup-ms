from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.rfi import ConstructionRFI


class RFIRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, rfi_id: int) -> ConstructionRFI | None:
        result = await self.db.execute(
            select(ConstructionRFI)
            .options(joinedload(ConstructionRFI.submitter))
            .where(ConstructionRFI.id == rfi_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionRFI]:
        result = await self.db.execute(
            select(ConstructionRFI)
            .options(joinedload(ConstructionRFI.submitter))
            .where(ConstructionRFI.project_id == project_id)
            .order_by(ConstructionRFI.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def next_rfi_number(self, project_id: int) -> str:
        result = await self.db.execute(
            select(func.count()).select_from(ConstructionRFI)
            .where(ConstructionRFI.project_id == project_id)
        )
        count = result.scalar_one()
        return f"RFI-{count + 1:03d}"

    async def create(self, data: dict) -> ConstructionRFI:
        rfi = ConstructionRFI(**data)
        self.db.add(rfi)
        await self.db.flush()
        return (await self.get_by_id(rfi.id))  # type: ignore[return-value]

    async def update(self, rfi: ConstructionRFI, data: dict) -> ConstructionRFI:
        for key, value in data.items():
            setattr(rfi, key, value)
        await self.db.flush()
        return rfi

    async def delete(self, rfi: ConstructionRFI) -> None:
        await self.db.delete(rfi)
        await self.db.flush()
