from pydantic import BaseModel
from decimal import Decimal


class StatusCount(BaseModel):
    status: str
    count: int


class TypeCount(BaseModel):
    project_type: str
    count: int


class BudgetByProject(BaseModel):
    name: str
    budget: float
    actual_cost: float


class MaterialCostByType(BaseModel):
    material_type: str
    total_cost: float


class MilestoneStatusCount(BaseModel):
    status: str
    count: int


class ConstructionAnalyticsResponse(BaseModel):
    projects_by_status: list[StatusCount]
    projects_by_type: list[TypeCount]
    budget_by_project: list[BudgetByProject]
    material_cost_by_type: list[MaterialCostByType]
    milestone_status_counts: list[MilestoneStatusCount]
    total_budget: float
    total_actual_cost: float
    avg_progress: float
