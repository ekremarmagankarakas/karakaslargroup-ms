from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.image import ImageResponse


class RequirementStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class RequirementCreate(BaseModel):
    item_name: str
    price: Decimal
    explanation: str | None = None


class RequirementStatusUpdate(BaseModel):
    status: Literal[RequirementStatus.accepted, RequirementStatus.declined]


class RequirementResponse(BaseModel):
    id: int
    user_id: int
    username: str
    item_name: str
    price: Decimal
    explanation: str | None
    status: RequirementStatus
    paid: bool
    approved_by: int | None
    approved_by_username: str | None
    images: list[ImageResponse]
    is_favorited: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaginatedRequirementsResponse(BaseModel):
    items: list[RequirementResponse]
    total: int
    page: int
    limit: int
    total_pages: int
