from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUser, get_db
from app.models.construction.material import ConstructionMaterial
from app.models.construction.milestone import ConstructionMilestone
from app.models.construction.project import ConstructionProject
from app.schemas.construction.analytics import (
    BudgetByProject,
    ConstructionAnalyticsResponse,
    MaterialCostByType,
    MilestoneStatusCount,
    StatusCount,
    TypeCount,
)

router = APIRouter()


@router.get("/analytics", response_model=ConstructionAnalyticsResponse)
async def get_construction_analytics(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConstructionAnalyticsResponse:
    # Projects by status
    status_rows = await db.execute(
        select(ConstructionProject.status, func.count(ConstructionProject.id))
        .group_by(ConstructionProject.status)
    )
    projects_by_status = [
        StatusCount(status=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1])
        for row in status_rows.all()
    ]

    # Projects by type
    type_rows = await db.execute(
        select(ConstructionProject.project_type, func.count(ConstructionProject.id))
        .where(ConstructionProject.project_type.isnot(None))
        .group_by(ConstructionProject.project_type)
    )
    projects_by_type = [
        TypeCount(project_type=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1])
        for row in type_rows.all()
    ]

    # Load all projects with materials for budget_by_project and actual cost
    project_result = await db.execute(
        select(ConstructionProject).options(joinedload(ConstructionProject.materials))
    )
    projects = project_result.unique().scalars().all()

    budget_by_project: list[BudgetByProject] = []
    total_budget = 0.0
    total_actual_cost = 0.0
    progress_values: list[int] = []

    for project in projects:
        project_budget = float(project.budget) if project.budget is not None else 0.0
        project_actual = sum(
            float(m.quantity_used) * float(m.unit_cost)
            for m in project.materials
            if m.unit_cost is not None
        )
        budget_by_project.append(
            BudgetByProject(
                name=project.name,
                budget=project_budget,
                actual_cost=project_actual,
            )
        )
        total_budget += project_budget
        total_actual_cost += project_actual
        progress_values.append(project.progress_pct)

    avg_progress = sum(progress_values) / len(progress_values) if progress_values else 0.0

    # Material cost by type (aggregate across all materials)
    material_rows = await db.execute(
        select(ConstructionMaterial.material_type, ConstructionMaterial.quantity_used, ConstructionMaterial.unit_cost)
        .where(ConstructionMaterial.unit_cost.isnot(None))
    )
    type_cost_map: dict[str, float] = defaultdict(float)
    for row in material_rows.all():
        type_cost_map[row[0]] += float(row[1]) * float(row[2])

    material_cost_by_type = [
        MaterialCostByType(material_type=mtype, total_cost=cost)
        for mtype, cost in type_cost_map.items()
    ]

    # Milestone status counts
    milestone_rows = await db.execute(
        select(ConstructionMilestone.status, func.count(ConstructionMilestone.id))
        .group_by(ConstructionMilestone.status)
    )
    milestone_status_counts = [
        MilestoneStatusCount(status=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1])
        for row in milestone_rows.all()
    ]

    return ConstructionAnalyticsResponse(
        projects_by_status=projects_by_status,
        projects_by_type=projects_by_type,
        budget_by_project=budget_by_project,
        material_cost_by_type=material_cost_by_type,
        milestone_status_counts=milestone_status_counts,
        total_budget=total_budget,
        total_actual_cost=total_actual_cost,
        avg_progress=avg_progress,
    )
