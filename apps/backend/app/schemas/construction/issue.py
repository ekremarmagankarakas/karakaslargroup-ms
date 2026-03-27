from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.issue import ConstructionIssueSeverity, ConstructionIssueStatus


class IssueCreate(BaseModel):
    title: str
    description: str | None = None
    severity: ConstructionIssueSeverity = ConstructionIssueSeverity.medium


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: ConstructionIssueSeverity | None = None
    status: ConstructionIssueStatus | None = None


class IssueResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: str | None
    severity: ConstructionIssueSeverity
    status: ConstructionIssueStatus
    reported_by: int | None
    reporter_username: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
