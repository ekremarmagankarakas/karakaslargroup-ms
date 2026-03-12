from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.punch_list_item import PunchListStatus


class PunchListItemCreate(BaseModel):
    title: str
    description: str | None = None
    location_on_site: str | None = None
    subcontractor_id: int | None = None
    assigned_to: int | None = None
    due_date: date | None = None


class PunchListItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location_on_site: str | None = None
    subcontractor_id: int | None = None
    assigned_to: int | None = None
    status: PunchListStatus | None = None
    due_date: date | None = None
    completed_date: date | None = None


class PunchListItemResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: str | None
    location_on_site: str | None
    subcontractor_id: int | None
    subcontractor_name: str | None
    assigned_to: int | None
    assignee_username: str | None
    status: PunchListStatus
    due_date: date | None
    completed_date: date | None
    verified_by: int | None
    verifier_username: str | None
    created_by: int
    creator_username: str | None
    is_overdue: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
