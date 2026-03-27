from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.rfi import RFIPriority, RFIStatus


class RFICreate(BaseModel):
    subject: str
    question: str
    submitted_to: str
    priority: RFIPriority = RFIPriority.normal
    due_date: date | None = None


class RFIUpdate(BaseModel):
    subject: str | None = None
    question: str | None = None
    response: str | None = None
    status: RFIStatus | None = None
    priority: RFIPriority | None = None
    submitted_to: str | None = None
    submitted_date: date | None = None
    response_date: date | None = None
    due_date: date | None = None
    answered_by_name: str | None = None


class RFIResponse(BaseModel):
    id: int
    project_id: int
    rfi_number: str
    subject: str
    question: str
    response: str | None
    status: RFIStatus
    priority: RFIPriority
    submitted_to: str
    submitted_date: date | None
    response_date: date | None
    due_date: date | None
    submitted_by: int | None
    submitter_username: str | None
    answered_by_name: str | None
    days_open: int | None
    is_overdue: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
