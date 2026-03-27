from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.permit import PermitStatus, PermitType


class PermitCreate(BaseModel):
    permit_type: PermitType
    permit_number: str | None = None
    issuing_authority: str
    status: PermitStatus = PermitStatus.not_applied
    applied_date: date | None = None
    approved_date: date | None = None
    expiry_date: date | None = None
    notes: str | None = None


class PermitUpdate(BaseModel):
    permit_type: PermitType | None = None
    permit_number: str | None = None
    issuing_authority: str | None = None
    status: PermitStatus | None = None
    applied_date: date | None = None
    approved_date: date | None = None
    expiry_date: date | None = None
    notes: str | None = None


class PermitResponse(BaseModel):
    id: int
    project_id: int
    permit_type: PermitType
    permit_number: str | None
    issuing_authority: str
    status: PermitStatus
    applied_date: date | None
    approved_date: date | None
    expiry_date: date | None
    notes: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
