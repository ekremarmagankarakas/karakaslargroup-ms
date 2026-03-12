from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.daily_log import ConstructionDailyLog


class ConstructionDailyLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, log_id: int) -> ConstructionDailyLog | None:
        result = await self.db.execute(
            select(ConstructionDailyLog)
            .options(joinedload(ConstructionDailyLog.recorder))
            .where(ConstructionDailyLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(
        self, project_id: int, page: int = 1, limit: int = 20
    ) -> tuple[list[ConstructionDailyLog], int]:
        base_query = select(ConstructionDailyLog).where(
            ConstructionDailyLog.project_id == project_id
        )
        total = await self.db.scalar(
            select(func.count()).select_from(base_query.subquery())
        ) or 0
        offset = (page - 1) * limit
        result = await self.db.execute(
            base_query.options(joinedload(ConstructionDailyLog.recorder))
            .order_by(ConstructionDailyLog.log_date.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().unique().all()), total

    async def get_by_date(self, project_id: int, log_date: date) -> ConstructionDailyLog | None:
        result = await self.db.execute(
            select(ConstructionDailyLog).where(
                ConstructionDailyLog.project_id == project_id,
                ConstructionDailyLog.log_date == log_date,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> ConstructionDailyLog:
        log = ConstructionDailyLog(**data)
        self.db.add(log)
        await self.db.flush()
        return await self.get_by_id(log.id)  # type: ignore[return-value]

    async def update(self, log: ConstructionDailyLog, data: dict) -> ConstructionDailyLog:
        for key, value in data.items():
            setattr(log, key, value)
        await self.db.flush()
        return log

    async def delete(self, log: ConstructionDailyLog) -> None:
        await self.db.delete(log)
        await self.db.flush()
