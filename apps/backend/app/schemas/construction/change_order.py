from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.change_order import ChangeOrderStatus


class ChangeOrderCreate(BaseModel):
    title: str
    description: str
    cost_delta: Decimal = Decimal("0")
    schedule_delta_days: int | None = None


class ChangeOrderUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cost_delta: Decimal | None = None
    schedule_delta_days: int | None = None


class ChangeOrderResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    cost_delta: Decimal
    schedule_delta_days: int | None
    status: ChangeOrderStatus
    requested_by: int | None
    requester_username: str | None
    reviewed_by: int | None
    reviewer_username: str | None
    created_at: datetime
    reviewed_at: datetime | None
    model_config = ConfigDict(from_attributes=True)
