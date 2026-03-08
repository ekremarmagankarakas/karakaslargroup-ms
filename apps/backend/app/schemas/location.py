from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserDropdownItem


class LocationCreate(BaseModel):
    name: str
    address: str | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None


class LocationResponse(BaseModel):
    id: int
    name: str
    address: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LocationWithUsersResponse(LocationResponse):
    users: list[UserDropdownItem] = []


class UserLocationAssign(BaseModel):
    user_id: int
