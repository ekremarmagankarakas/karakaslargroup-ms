from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.document import ConstructionDocument


class ConstructionDocumentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, doc_id: int) -> ConstructionDocument | None:
        result = await self.db.execute(
            select(ConstructionDocument)
            .options(joinedload(ConstructionDocument.uploader))
            .where(ConstructionDocument.id == doc_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionDocument]:
        result = await self.db.execute(
            select(ConstructionDocument)
            .options(joinedload(ConstructionDocument.uploader))
            .where(ConstructionDocument.project_id == project_id)
            .order_by(ConstructionDocument.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionDocument:
        doc = ConstructionDocument(**data)
        self.db.add(doc)
        await self.db.flush()
        await self.db.refresh(doc)
        return doc

    async def delete(self, doc: ConstructionDocument) -> None:
        await self.db.delete(doc)
        await self.db.flush()
