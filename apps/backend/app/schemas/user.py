import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator


class UserRole(str, Enum):
    employee = "employee"
    manager = "manager"
    accountant = "accountant"
    admin = "admin"


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ]+$", v):
            raise ValueError("Invalid username characters")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserWithLocationsResponse(UserResponse):
    """Extended UserResponse that includes assigned location data."""
    location_ids: list[int] = []
    location_names: list[str] = []


class UserUpdate(BaseModel):
    role: UserRole | None = None
    email: str | None = None
    is_active: bool | None = None


class UserDropdownItem(BaseModel):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "PasswordChangeRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
