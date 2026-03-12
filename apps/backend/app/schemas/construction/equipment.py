from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.equipment import EquipmentCategory, EquipmentStatus


class EquipmentCreate(BaseModel):
    name: str
    category: EquipmentCategory = EquipmentCategory.other
    status: EquipmentStatus = EquipmentStatus.available
    model_number: str | None = None
    serial_number: str | None = None
    supplier: str | None = None
    rental_rate_daily: Decimal | None = None
    mobilization_date: date | None = None
    demobilization_date: date | None = None
    last_maintenance_date: date | None = None
    next_maintenance_date: date | None = None
    notes: str | None = None


class EquipmentUpdate(BaseModel):
    name: str | None = None
    category: EquipmentCategory | None = None
    status: EquipmentStatus | None = None
    model_number: str | None = None
    serial_number: str | None = None
    supplier: str | None = None
    rental_rate_daily: Decimal | None = None
    mobilization_date: date | None = None
    demobilization_date: date | None = None
    last_maintenance_date: date | None = None
    next_maintenance_date: date | None = None
    notes: str | None = None


class EquipmentResponse(BaseModel):
    id: int
    project_id: int
    name: str
    category: EquipmentCategory
    status: EquipmentStatus
    model_number: str | None
    serial_number: str | None
    supplier: str | None
    rental_rate_daily: Decimal | None
    mobilization_date: date | None
    demobilization_date: date | None
    last_maintenance_date: date | None
    next_maintenance_date: date | None
    notes: str | None
    created_by: int | None
    creator_username: str | None
    created_at: datetime
    maintenance_overdue: bool = False
    model_config = ConfigDict(from_attributes=True)
