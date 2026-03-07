from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.requirement import RequirementResponse


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    requirement_id: int
    created_at: datetime
    requirement: RequirementResponse
    model_config = ConfigDict(from_attributes=True)


class PaginatedFavoritesResponse(BaseModel):
    items: list[RequirementResponse]
    total: int
    page: int
    limit: int
    total_pages: int
