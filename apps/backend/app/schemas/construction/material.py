from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.construction.material import ConstructionMaterialUnit


class MaterialCreate(BaseModel):
    name: str
    material_type: str
    unit: ConstructionMaterialUnit
    quantity_planned: Decimal
    quantity_used: Decimal = Decimal("0")
    unit_cost: Decimal | None = None
    notes: str | None = None


class MaterialUpdate(BaseModel):
    name: str | None = None
    material_type: str | None = None
    unit: ConstructionMaterialUnit | None = None
    quantity_planned: Decimal | None = None
    quantity_used: Decimal | None = None
    unit_cost: Decimal | None = None
    notes: str | None = None


class MaterialResponse(BaseModel):
    id: int
    project_id: int
    name: str
    material_type: str
    unit: ConstructionMaterialUnit
    quantity_planned: Decimal
    quantity_used: Decimal
    unit_cost: Decimal | None
    notes: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
