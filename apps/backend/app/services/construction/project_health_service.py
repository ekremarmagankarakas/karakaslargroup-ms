from datetime import date

from fastapi import HTTPException
from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.issue import ConstructionIssue, ConstructionIssueSeverity, ConstructionIssueStatus
from app.models.construction.material import ConstructionMaterial
from app.models.construction.milestone import ConstructionMilestone, ConstructionTaskStatus
from app.models.construction.project import ConstructionProject


class ProjectHealthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_health(self, project_id: int) -> dict:
        proj_res = await self.db.execute(
            select(ConstructionProject).where(ConstructionProject.id == project_id)
        )
        project = proj_res.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

        details: list[str] = []
        today = date.today()

        # Budget status
        budget_status = "green"
        if project.budget:
            cost_res = await self.db.execute(
                select(sa_func.sum(ConstructionMaterial.quantity_used * ConstructionMaterial.unit_cost))
                .where(ConstructionMaterial.project_id == project_id)
            )
            actual_cost = float(cost_res.scalar() or 0)
            budget_pct = (actual_cost / float(project.budget)) * 100
            if budget_pct >= 100:
                budget_status = "red"
                details.append(f"Bütçe aşıldı: gerçekleşen maliyet bütçenin %{round(budget_pct)}'i")
            elif budget_pct >= 80:
                budget_status = "amber"
                details.append(f"Bütçe uyarısı: gerçekleşen maliyet bütçenin %{round(budget_pct)}'i")

        # Schedule status
        schedule_status = "green"
        milestones_res = await self.db.execute(
            select(ConstructionMilestone)
            .where(
                ConstructionMilestone.project_id == project_id,
                ConstructionMilestone.status != ConstructionTaskStatus.completed,
                ConstructionMilestone.due_date.isnot(None),
            )
        )
        milestones = milestones_res.scalars().all()
        for m in milestones:
            if m.due_date and m.due_date < today:
                days_late = (today - m.due_date).days
                if days_late > 14:
                    schedule_status = "red"
                    details.append(f"Kritik gecikme: '{m.title}' aşaması {days_late} gün gecikmeli")
                elif schedule_status != "red":
                    schedule_status = "amber"
                    details.append(f"Gecikme: '{m.title}' aşaması {days_late} gün gecikmeli")

        # Issue status
        issue_status = "green"
        issues_res = await self.db.execute(
            select(ConstructionIssue)
            .where(
                ConstructionIssue.project_id == project_id,
                ConstructionIssue.status != ConstructionIssueStatus.resolved,
            )
        )
        open_issues = issues_res.scalars().all()
        for i in open_issues:
            if i.severity == ConstructionIssueSeverity.critical:
                issue_status = "red"
                details.append(f"Kritik sorun: {i.title}")
            elif i.severity == ConstructionIssueSeverity.high and issue_status != "red":
                issue_status = "amber"
                details.append(f"Yüksek öncelikli sorun: {i.title}")

        rank = {"red": 2, "amber": 1, "green": 0}
        worst = max([budget_status, schedule_status, issue_status], key=lambda s: rank[s])
        if not details:
            details.append("Tüm göstergeler normal.")

        return {
            "overall": worst,
            "budget_status": budget_status,
            "schedule_status": schedule_status,
            "issue_status": issue_status,
            "details": details,
        }
