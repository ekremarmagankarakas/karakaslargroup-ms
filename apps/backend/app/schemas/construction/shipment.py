from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.material import ConstructionMaterialUnit
from app.models.construction.shipment import ShipmentStatus


class ShipmentCreate(BaseModel):
    material_id: int | None = None
    material_name: str
    supplier_name: str
    quantity_ordered: Decimal
    unit: ConstructionMaterialUnit
    unit_cost: Decimal | None = None
    total_cost: Decimal | None = None
    status: ShipmentStatus = ShipmentStatus.ordered
    order_date: date
    expected_delivery_date: date | None = None
    notes: str | None = None
    delivery_note_number: str | None = None


class ShipmentUpdate(BaseModel):
    material_name: str | None = None
    supplier_name: str | None = None
    quantity_ordered: Decimal | None = None
    quantity_delivered: Decimal | None = None
    unit: ConstructionMaterialUnit | None = None
    unit_cost: Decimal | None = None
    total_cost: Decimal | None = None
    status: ShipmentStatus | None = None
    order_date: date | None = None
    expected_delivery_date: date | None = None
    actual_delivery_date: date | None = None
    delivery_note_number: str | None = None
    notes: str | None = None
    received_by: int | None = None


class ShipmentResponse(BaseModel):
    id: int
    project_id: int
    material_id: int | None
    material_name: str
    supplier_name: str
    quantity_ordered: Decimal
    quantity_delivered: Decimal | None
    unit: ConstructionMaterialUnit
    unit_cost: Decimal | None
    total_cost: Decimal | None
    status: ShipmentStatus
    order_date: date
    expected_delivery_date: date | None
    actual_delivery_date: date | None
    delivery_note_number: str | None
    notes: str | None
    received_by: int | None
    receiver_username: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
