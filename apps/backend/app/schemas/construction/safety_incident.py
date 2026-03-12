from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.safety_incident import IncidentStatus, IncidentType


class SafetyIncidentCreate(BaseModel):
    incident_type: IncidentType
    title: str
    description: str
    location_on_site: str | None = None
    incident_date: date
    injured_person_name: str | None = None
    time_lost_days: int | None = None
    root_cause: str | None = None
    corrective_actions: str | None = None


class SafetyIncidentUpdate(BaseModel):
    incident_type: IncidentType | None = None
    title: str | None = None
    description: str | None = None
    location_on_site: str | None = None
    incident_date: date | None = None
    injured_person_name: str | None = None
    time_lost_days: int | None = None
    root_cause: str | None = None
    corrective_actions: str | None = None
    status: IncidentStatus | None = None


class SafetyIncidentResponse(BaseModel):
    id: int
    project_id: int
    incident_type: IncidentType
    title: str
    description: str
    location_on_site: str | None
    incident_date: date
    injured_person_name: str | None
    time_lost_days: int | None
    root_cause: str | None
    corrective_actions: str | None
    status: IncidentStatus
    reported_by: int | None
    reporter_username: str | None
    closed_at: datetime | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SafetyStatsResponse(BaseModel):
    days_since_last_incident: int | None
    open_count: int
    major_injury_open: int
    by_type: dict[str, int]
