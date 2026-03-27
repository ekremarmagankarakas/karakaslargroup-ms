from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.project_member import ConstructionProjectRole


class ProjectMemberCreate(BaseModel):
    user_id: int
    construction_role: ConstructionProjectRole
    joined_at: date | None = None
    notes: str | None = None


class ProjectMemberUpdate(BaseModel):
    construction_role: ConstructionProjectRole | None = None
    joined_at: date | None = None
    notes: str | None = None


class ProjectMemberResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    username: str
    email: str
    global_role: str
    construction_role: ConstructionProjectRole
    joined_at: date | None
    notes: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
