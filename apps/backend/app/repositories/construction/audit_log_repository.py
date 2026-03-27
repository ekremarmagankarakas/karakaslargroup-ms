from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.audit_log import ConstructionAuditLog


class ConstructionAuditLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: dict) -> ConstructionAuditLog:
        log = ConstructionAuditLog(**data)
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_by_project(self, project_id: int, limit: int = 100) -> list[ConstructionAuditLog]:
        result = await self.db.execute(
            select(ConstructionAuditLog)
            .options(joinedload(ConstructionAuditLog.user))
            .where(ConstructionAuditLog.project_id == project_id)
            .order_by(ConstructionAuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().unique().all())
