from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    project_id: int
    user_id: int | None
    username: str | None
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
