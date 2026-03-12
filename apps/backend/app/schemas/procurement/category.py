from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    name: str
    color: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
