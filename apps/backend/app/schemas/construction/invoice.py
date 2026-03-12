from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field

from app.models.construction.invoice import InvoiceStatus


class InvoiceCreate(BaseModel):
    invoice_number: str
    subcontractor_id: int | None = None
    shipment_id: int | None = None
    description: str
    amount: Decimal
    tax_amount: Decimal = Decimal("0")
    invoice_date: date
    due_date: date | None = None
    notes: str | None = None


class InvoiceUpdate(BaseModel):
    invoice_number: str | None = None
    description: str | None = None
    amount: Decimal | None = None
    tax_amount: Decimal | None = None
    status: InvoiceStatus | None = None
    invoice_date: date | None = None
    due_date: date | None = None
    notes: str | None = None


class InvoiceResponse(BaseModel):
    id: int
    project_id: int
    invoice_number: str
    subcontractor_id: int | None
    subcontractor_name: str | None
    shipment_id: int | None
    description: str
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: InvoiceStatus
    invoice_date: date
    due_date: date | None
    paid_date: date | None
    paid_by: int | None
    payer_username: str | None
    notes: str | None
    is_overdue: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
