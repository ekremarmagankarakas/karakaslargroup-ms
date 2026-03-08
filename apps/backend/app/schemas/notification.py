from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    requirement_id: int | None
    message: str
    read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
