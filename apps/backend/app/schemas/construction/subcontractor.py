from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.subcontractor import SubcontractorStatus


class SubcontractorCreate(BaseModel):
    company_name: str
    trade: str
    contact_name: str
    contact_phone: str
    contact_email: str | None = None
    contract_value: Decimal | None = None
    status: SubcontractorStatus = SubcontractorStatus.active
    notes: str | None = None


class SubcontractorUpdate(BaseModel):
    company_name: str | None = None
    trade: str | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    contract_value: Decimal | None = None
    status: SubcontractorStatus | None = None
    notes: str | None = None


class SubcontractorResponse(BaseModel):
    id: int
    project_id: int
    company_name: str
    trade: str
    contact_name: str
    contact_phone: str
    contact_email: str | None
    contract_value: Decimal | None
    status: SubcontractorStatus
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
