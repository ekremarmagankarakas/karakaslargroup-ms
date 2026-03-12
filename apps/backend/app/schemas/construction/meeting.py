from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ActionCreate(BaseModel):
    description: str
    assigned_to_name: str
    due_date: date | None = None


class ActionResponse(BaseModel):
    id: int
    meeting_id: int
    description: str
    assigned_to_name: str
    due_date: date | None
    completed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MeetingCreate(BaseModel):
    title: str
    meeting_date: date
    location: str | None = None
    attendees: str | None = None
    agenda: str | None = None
    summary: str
    decisions: str | None = None
    actions: list[ActionCreate] = []


class MeetingUpdate(BaseModel):
    title: str | None = None
    meeting_date: date | None = None
    location: str | None = None
    attendees: str | None = None
    agenda: str | None = None
    summary: str | None = None
    decisions: str | None = None


class MeetingResponse(BaseModel):
    id: int
    project_id: int
    title: str
    meeting_date: date
    location: str | None
    attendees: str | None
    agenda: str | None
    summary: str
    decisions: str | None
    created_by: int | None
    creator_username: str | None
    actions: list[ActionResponse]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
