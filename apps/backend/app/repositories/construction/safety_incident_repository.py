from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.safety_incident import ConstructionSafetyIncident, IncidentStatus, IncidentType


class SafetyIncidentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, incident_id: int) -> ConstructionSafetyIncident | None:
        result = await self.db.execute(
            select(ConstructionSafetyIncident)
            .options(joinedload(ConstructionSafetyIncident.reporter))
            .where(ConstructionSafetyIncident.id == incident_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionSafetyIncident]:
        result = await self.db.execute(
            select(ConstructionSafetyIncident)
            .options(joinedload(ConstructionSafetyIncident.reporter))
            .where(ConstructionSafetyIncident.project_id == project_id)
            .order_by(ConstructionSafetyIncident.incident_date.desc())
        )
        return list(result.scalars().unique().all())

    async def get_open_count(self, project_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(ConstructionSafetyIncident)
            .where(
                ConstructionSafetyIncident.project_id == project_id,
                ConstructionSafetyIncident.status != IncidentStatus.closed,
            )
        )
        return result.scalar_one()

    async def get_most_recent_date(self, project_id: int) -> date | None:
        result = await self.db.execute(
            select(ConstructionSafetyIncident.incident_date)
            .where(ConstructionSafetyIncident.project_id == project_id)
            .order_by(ConstructionSafetyIncident.incident_date.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> ConstructionSafetyIncident:
        incident = ConstructionSafetyIncident(**data)
        self.db.add(incident)
        await self.db.flush()
        return (await self.get_by_id(incident.id))  # type: ignore[return-value]

    async def update(self, incident: ConstructionSafetyIncident, data: dict) -> ConstructionSafetyIncident:
        for key, value in data.items():
            setattr(incident, key, value)
        await self.db.flush()
        return incident

    async def delete(self, incident: ConstructionSafetyIncident) -> None:
        await self.db.delete(incident)
        await self.db.flush()
