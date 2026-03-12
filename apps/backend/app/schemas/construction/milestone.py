from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.milestone import ConstructionTaskStatus


class MilestoneCreate(BaseModel):
    title: str
    description: str | None = None
    due_date: date | None = None
    status: ConstructionTaskStatus = ConstructionTaskStatus.not_started
    completion_pct: int = 0


class MilestoneUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: date | None = None
    status: ConstructionTaskStatus | None = None
    completion_pct: int | None = None


class MilestoneResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: str | None
    due_date: date | None
    status: ConstructionTaskStatus
    completion_pct: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
