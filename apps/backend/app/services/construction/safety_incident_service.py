from datetime import date

from fastapi import HTTPException, status

from app.models.construction.safety_incident import IncidentStatus, IncidentType
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.safety_incident_repository import SafetyIncidentRepository
from app.schemas.construction.safety_incident import (
    SafetyIncidentCreate,
    SafetyIncidentResponse,
    SafetyIncidentUpdate,
    SafetyStatsResponse,
)


def _to_response(incident) -> SafetyIncidentResponse:
    return SafetyIncidentResponse(
        id=incident.id,
        project_id=incident.project_id,
        incident_type=incident.incident_type,
        title=incident.title,
        description=incident.description,
        location_on_site=incident.location_on_site,
        incident_date=incident.incident_date,
        injured_person_name=incident.injured_person_name,
        time_lost_days=incident.time_lost_days,
        root_cause=incident.root_cause,
        corrective_actions=incident.corrective_actions,
        status=incident.status,
        reported_by=incident.reported_by,
        reporter_username=incident.reporter.username if incident.reporter else None,
        closed_at=incident.closed_at,
        created_at=incident.created_at,
    )


class SafetyIncidentService:
    def __init__(
        self,
        incident_repo: SafetyIncidentRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.incident_repo = incident_repo
        self.project_repo = project_repo

    async def list_incidents(self, project_id: int) -> list[SafetyIncidentResponse]:
        await self._require_project(project_id)
        incidents = await self.incident_repo.get_by_project(project_id)
        return [_to_response(i) for i in incidents]

    async def get_stats(self, project_id: int) -> SafetyStatsResponse:
        await self._require_project(project_id)
        incidents = await self.incident_repo.get_by_project(project_id)
        open_count = sum(1 for i in incidents if i.status != IncidentStatus.closed)
        major_open = sum(
            1 for i in incidents
            if i.incident_type == IncidentType.major_injury and i.status != IncidentStatus.closed
        )
        by_type: dict[str, int] = {}
        for i in incidents:
            by_type[i.incident_type.value] = by_type.get(i.incident_type.value, 0) + 1

        last_date = await self.incident_repo.get_most_recent_date(project_id)
        dsli: int | None = None
        if last_date:
            dsli = (date.today() - last_date).days

        return SafetyStatsResponse(
            days_since_last_incident=dsli,
            open_count=open_count,
            major_injury_open=major_open,
            by_type=by_type,
        )

    async def create_incident(self, current_user, project_id: int, body: SafetyIncidentCreate) -> SafetyIncidentResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        data = body.model_dump()
        data["project_id"] = project_id
        data["reported_by"] = current_user.id
        incident = await self.incident_repo.create(data)

        # Notify managers on major injury
        if body.incident_type == IncidentType.major_injury:
            from sqlalchemy import select as sa_select
            from app.models.user import User, UserRole
            db = self.incident_repo.db
            from app.models.notification import Notification
            managers_res = await db.execute(
                sa_select(User).where(User.role.in_([UserRole.manager, UserRole.admin]))
            )
            managers = managers_res.scalars().all()
            for mgr in managers:
                db.add(Notification(
                    user_id=mgr.id,
                    message=f"⚠️ Ciddi iş kazası kaydedildi: {body.title} — {project.name}",
                ))

        return _to_response(incident)

    async def update_incident(self, current_user, project_id: int, incident_id: int, body: SafetyIncidentUpdate) -> SafetyIncidentResponse:
        incident = await self._require_incident(project_id, incident_id)
        from datetime import datetime, timezone
        updates = body.model_dump(exclude_unset=True)
        if updates.get("status") == IncidentStatus.closed and incident.status != IncidentStatus.closed:
            updates["closed_at"] = datetime.now(timezone.utc)
        await self.incident_repo.update(incident, updates)
        incident = await self.incident_repo.get_by_id(incident_id)
        return _to_response(incident)

    async def delete_incident(self, project_id: int, incident_id: int) -> None:
        incident = await self._require_incident(project_id, incident_id)
        await self.incident_repo.delete(incident)

    async def _require_project(self, project_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        return project

    async def _require_incident(self, project_id: int, incident_id: int):
        incident = await self.incident_repo.get_by_id(incident_id)
        if not incident or incident.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Güvenlik olayı bulunamadı")
        return incident
