from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.audit_log import AuditAction, AuditLog


class AuditLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        requirement_id: int,
        actor_id: int,
        action: AuditAction,
        old_value: str | None = None,
        new_value: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            requirement_id=requirement_id,
            actor_id=actor_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return log

    async def get_for_requirement(self, requirement_id: int) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .options(joinedload(AuditLog.actor))
            .where(AuditLog.requirement_id == requirement_id)
            .order_by(AuditLog.created_at)
        )
        return list(result.scalars().unique().all())
