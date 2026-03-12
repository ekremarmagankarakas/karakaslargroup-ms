from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.project import ConstructionProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    location_id: int | None = None
    status: ConstructionProjectStatus = ConstructionProjectStatus.planning
    start_date: date | None = None
    end_date: date | None = None
    budget: Decimal | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location_id: int | None = None
    status: ConstructionProjectStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget: Decimal | None = None
    progress_pct: int | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    location_id: int | None
    location_name: str | None
    created_by: int
    created_by_username: str
    status: ConstructionProjectStatus
    start_date: date | None
    end_date: date | None
    budget: Decimal | None
    progress_pct: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaginatedProjectsResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    limit: int
    total_pages: int
