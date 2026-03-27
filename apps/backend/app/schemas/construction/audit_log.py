from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.audit_log import ConstructionAuditAction


class AuditLogResponse(BaseModel):
    id: int
    project_id: int
    user_id: int | None
    username: str | None
    action: ConstructionAuditAction
    field_name: str | None
    old_value: str | None
    new_value: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
