from collections import defaultdict
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.material import ConstructionMaterial
from app.models.construction.milestone import ConstructionMilestone, ConstructionTaskStatus
from app.models.construction.project import ConstructionProject
from app.schemas.construction.analytics import (
    BudgetByProject,
    ConstructionAnalyticsResponse,
    MaterialCostByType,
    MilestoneStatusCount,
    SCurvePoint,
    StatusCount,
    TypeCount,
)


class ConstructionAnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_analytics(self) -> ConstructionAnalyticsResponse:
        # Projects by status
        status_rows = await self.db.execute(
            select(ConstructionProject.status, func.count(ConstructionProject.id))
            .group_by(ConstructionProject.status)
        )
        projects_by_status = [
            StatusCount(status=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1])
            for row in status_rows.all()
        ]

        # Projects by type
        type_rows = await self.db.execute(
            select(ConstructionProject.project_type, func.count(ConstructionProject.id))
            .where(ConstructionProject.project_type.isnot(None))
            .group_by(ConstructionProject.project_type)
        )
        projects_by_type = [
            TypeCount(project_type=row[0].value if hasattr(row[0], "value") else str(row[0]), count=row[1])
            for row in type_rows.all()
        ]

        # All projects with materials
        project_result = await self.db.execute(
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
                BudgetByProject(name=project.name, budget=project_budget, actual_cost=project_actual)
            )
            total_budget += project_budget
            total_actual_cost += project_actual
            progress_values.append(project.progress_pct)

        avg_progress = sum(progress_values) / len(progress_values) if progress_values else 0.0

        # Material cost by type
        material_rows = await self.db.execute(
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
        milestone_rows = await self.db.execute(
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

    async def get_s_curve(self, project_id: int) -> list[SCurvePoint]:
        project_result = await self.db.execute(
            select(ConstructionProject).where(ConstructionProject.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

        milestones_result = await self.db.execute(
            select(ConstructionMilestone)
            .where(ConstructionMilestone.project_id == project_id)
            .order_by(ConstructionMilestone.due_date)
        )
        milestones = list(milestones_result.scalars().all())

        today = date.today()
        start = project.start_date or (today.replace(day=1) - timedelta(days=180))
        end = project.end_date or (today.replace(day=1) + timedelta(days=180))
        end = max(end, today)

        def month_key(d: date) -> str:
            return f"{d.year}-{d.month:02d}"

        buckets: list[date] = []
        cur = start.replace(day=1)
        end_month = end.replace(day=1)
        while cur <= end_month:
            buckets.append(cur)
            cur = cur.replace(year=cur.year + 1, month=1) if cur.month == 12 else cur.replace(month=cur.month + 1)

        if not buckets:
            return []

        n = len(buckets)
        total_ms = len(milestones)

        def last_day_of_month(d: date) -> date:
            return d.replace(day=31) if d.month == 12 else (d.replace(month=d.month + 1) - timedelta(days=1))

        points: list[SCurvePoint] = []
        for i, bucket in enumerate(buckets):
            month_end = last_day_of_month(bucket)

            if total_ms > 0:
                planned_ms_due = sum(1 for m in milestones if m.due_date and m.due_date <= month_end)
                planned = round(min(100.0, planned_ms_due / total_ms * 100), 1)
            else:
                planned = round(i / max(n - 1, 1) * 100, 1) if n > 1 else 100.0

            if bucket <= today.replace(day=1):
                if total_ms > 0:
                    actual_ms_done = sum(
                        1 for m in milestones
                        if m.status == ConstructionTaskStatus.completed
                        and m.due_date and m.due_date <= month_end
                    )
                    if bucket == today.replace(day=1):
                        actual: float | None = float(project.progress_pct)
                    else:
                        actual = round(min(100.0, actual_ms_done / total_ms * 100), 1)
                else:
                    if bucket == today.replace(day=1):
                        actual = float(project.progress_pct)
                    else:
                        months_elapsed = i + 1
                        months_total = (
                            today.replace(day=1).year * 12 + today.replace(day=1).month
                            - (start.replace(day=1).year * 12 + start.replace(day=1).month) + 1
                        )
                        if months_total > 0:
                            actual = round(min(float(project.progress_pct), float(project.progress_pct) * months_elapsed / months_total), 1)
                        else:
                            actual = float(project.progress_pct)
            else:
                actual = None

            points.append(SCurvePoint(date=month_key(bucket), planned=planned, actual=actual))

        return points
