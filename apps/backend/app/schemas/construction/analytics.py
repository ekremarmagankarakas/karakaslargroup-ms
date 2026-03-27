from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class StatusCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    count: int


class TypeCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_type: str
    count: int


class BudgetByProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    budget: float
    actual_cost: float


class MaterialCostByType(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    material_type: str
    total_cost: float


class MilestoneStatusCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    count: int


class SCurvePoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: str          # YYYY-MM format
    planned: float     # 0-100
    actual: float | None = None  # None for future months


class ConstructionAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    projects_by_status: list[StatusCount]
    projects_by_type: list[TypeCount]
    budget_by_project: list[BudgetByProject]
    material_cost_by_type: list[MaterialCostByType]
    milestone_status_counts: list[MilestoneStatusCount]
    total_budget: float
    total_actual_cost: float
    avg_progress: float
