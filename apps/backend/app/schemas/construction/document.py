from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: int
    project_id: int
    uploaded_by: int | None
    uploader_username: str | None
    file_key: str
    url: str
    original_filename: str
    file_size_bytes: int | None
    document_type: str | None
    caption: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
