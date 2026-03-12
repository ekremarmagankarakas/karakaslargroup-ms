"""
Construction-scoped tool definitions and handlers.

Claude sees only the tool names, descriptions and input schemas.
All SQL access goes through existing repositories.
"""

import json
from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

TOOL_DEFINITIONS: list[dict] = [
    {
        "name": "get_construction_projects",
        "description": (
            "List construction projects with status, progress, budget and type. "
            "Use this to answer questions about the project portfolio."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["planning", "active", "on_hold", "completed", "cancelled"],
                    "description": "Filter by project status",
                },
                "search": {
                    "type": "string",
                    "maxLength": 200,
                    "description": "Search in project name",
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 20,
                    "description": "Max results to return, default 10",
                },
            },
        },
    },
    {
        "name": "get_project_detail",
        "description": (
            "Get detailed info about a specific project: milestones, materials, "
            "open issues and recent daily logs."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {
                    "type": "integer",
                    "description": "ID of the construction project",
                },
            },
            "required": ["project_id"],
        },
    },
    {
        "name": "get_construction_stats",
        "description": (
            "Get portfolio summary: total projects, counts by status, total budget, "
            "total actual cost and average progress."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_open_issues",
        "description": (
            "List open or in-progress issues. Optionally filter by project."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {
                    "type": "integer",
                    "description": "Limit to a specific project (optional)",
                },
                "severity": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "critical"],
                    "description": "Filter by severity",
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 20,
                    "description": "Max results, default 10",
                },
            },
        },
    },
    {
        "name": "get_overdue_milestones",
        "description": (
            "List milestones whose due_date has passed and status is not completed. "
            "Optionally filter by project."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {
                    "type": "integer",
                    "description": "Limit to a specific project (optional)",
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 20,
                    "description": "Max results, default 10",
                },
            },
        },
    },
]


def _safe_int(inputs: dict, key: str, default: int, min_val: int, max_val: int) -> int:
    try:
        return max(min_val, min(max_val, int(inputs.get(key, default))))
    except (TypeError, ValueError):
        return default


async def run_construction_tool(
    name: str,
    inputs: dict[str, Any],
    db: AsyncSession,
    current_user: User,
) -> str:
    """Dispatch a construction tool call and return a JSON string result."""

    if name == "get_construction_projects":
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.construction.project import ConstructionProject, ConstructionProjectStatus

        status_val = inputs.get("status")
        status_filter = (
            ConstructionProjectStatus(status_val)
            if status_val in ("planning", "active", "on_hold", "completed", "cancelled")
            else None
        )
        search = str(inputs["search"])[:200] if inputs.get("search") else None
        limit = _safe_int(inputs, "limit", 10, 1, 20)

        q = (
            select(ConstructionProject)
            .options(joinedload(ConstructionProject.location))
            .order_by(ConstructionProject.created_at.desc())
            .limit(limit)
        )
        if status_filter:
            q = q.where(ConstructionProject.status == status_filter)
        if search:
            q = q.where(ConstructionProject.name.ilike(f"%{search}%"))

        result = await db.execute(q)
        projects = result.scalars().unique().all()
        return json.dumps([
            {
                "id": p.id,
                "name": p.name,
                "status": p.status.value,
                "project_type": p.project_type.value if p.project_type else None,
                "progress_pct": p.progress_pct,
                "budget": str(p.budget) if p.budget else None,
                "location": p.location.name if p.location else None,
                "start_date": str(p.start_date) if p.start_date else None,
                "end_date": str(p.end_date) if p.end_date else None,
            }
            for p in projects
        ])

    if name == "get_project_detail":
        project_id = inputs.get("project_id")
        if not isinstance(project_id, int):
            return json.dumps({"error": "project_id is required"})

        from sqlalchemy import select
        from sqlalchemy.orm import joinedload, selectinload
        from app.models.construction.project import ConstructionProject
        from app.models.construction.milestone import ConstructionMilestone
        from app.models.construction.material import ConstructionMaterial
        from app.models.construction.issue import ConstructionIssue
        from app.models.construction.daily_log import ConstructionDailyLog

        result = await db.execute(
            select(ConstructionProject)
            .options(joinedload(ConstructionProject.location))
            .where(ConstructionProject.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            return json.dumps({"error": f"Project {project_id} not found"})

        milestones_res = await db.execute(
            select(ConstructionMilestone)
            .where(ConstructionMilestone.project_id == project_id)
            .order_by(ConstructionMilestone.due_date)
        )
        milestones = milestones_res.scalars().all()

        materials_res = await db.execute(
            select(ConstructionMaterial)
            .where(ConstructionMaterial.project_id == project_id)
        )
        materials = materials_res.scalars().all()

        issues_res = await db.execute(
            select(ConstructionIssue)
            .where(
                ConstructionIssue.project_id == project_id,
                ConstructionIssue.status != "resolved",
            )
            .order_by(ConstructionIssue.created_at.desc())
            .limit(5)
        )
        open_issues = issues_res.scalars().all()

        logs_res = await db.execute(
            select(ConstructionDailyLog)
            .where(ConstructionDailyLog.project_id == project_id)
            .order_by(ConstructionDailyLog.log_date.desc())
            .limit(3)
        )
        recent_logs = logs_res.scalars().all()

        actual_cost = sum(
            float(m.quantity_used or 0) * float(m.unit_cost or 0)
            for m in materials
        )

        return json.dumps({
            "project": {
                "id": project.id,
                "name": project.name,
                "status": project.status.value,
                "progress_pct": project.progress_pct,
                "budget": str(project.budget) if project.budget else None,
                "actual_cost": round(actual_cost, 2),
            },
            "milestones": [
                {
                    "title": m.title,
                    "status": m.status.value,
                    "due_date": str(m.due_date) if m.due_date else None,
                    "completion_pct": m.completion_pct,
                }
                for m in milestones
            ],
            "open_issues": [
                {
                    "title": i.title,
                    "severity": i.severity.value,
                    "status": i.status.value,
                }
                for i in open_issues
            ],
            "recent_logs": [
                {
                    "date": str(l.log_date),
                    "weather": l.weather.value,
                    "worker_count": l.worker_count,
                    "summary": l.work_summary[:200],
                }
                for l in recent_logs
            ],
        })

    if name == "get_construction_stats":
        from sqlalchemy import func, select
        from app.models.construction.project import ConstructionProject

        total_res = await db.execute(select(func.count(ConstructionProject.id)))
        total = total_res.scalar() or 0

        status_res = await db.execute(
            select(ConstructionProject.status, func.count(ConstructionProject.id))
            .group_by(ConstructionProject.status)
        )
        by_status = {row[0].value: row[1] for row in status_res}

        budget_res = await db.execute(
            select(func.sum(ConstructionProject.budget), func.avg(ConstructionProject.progress_pct))
        )
        budget_row = budget_res.one()
        total_budget = float(budget_row[0] or 0)
        avg_progress = float(budget_row[1] or 0)

        return json.dumps({
            "total_projects": total,
            "by_status": by_status,
            "total_budget": round(total_budget, 2),
            "avg_progress_pct": round(avg_progress, 1),
        })

    if name == "get_open_issues":
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.construction.issue import ConstructionIssue, ConstructionIssueStatus
        from app.models.construction.project import ConstructionProject

        limit = _safe_int(inputs, "limit", 10, 1, 20)
        severity_val = inputs.get("severity")
        project_id = inputs.get("project_id")

        q = (
            select(ConstructionIssue, ConstructionProject.name)
            .join(ConstructionProject, ConstructionIssue.project_id == ConstructionProject.id)
            .where(ConstructionIssue.status != ConstructionIssueStatus.resolved)
            .order_by(ConstructionIssue.created_at.desc())
            .limit(limit)
        )
        if project_id:
            q = q.where(ConstructionIssue.project_id == int(project_id))
        if severity_val:
            q = q.where(ConstructionIssue.severity == severity_val)

        result = await db.execute(q)
        rows = result.all()
        return json.dumps([
            {
                "id": row[0].id,
                "project": row[1],
                "title": row[0].title,
                "severity": row[0].severity.value,
                "status": row[0].status.value,
            }
            for row in rows
        ])

    if name == "get_overdue_milestones":
        from sqlalchemy import select
        from app.models.construction.milestone import ConstructionMilestone, ConstructionTaskStatus
        from app.models.construction.project import ConstructionProject

        today = date.today()
        limit = _safe_int(inputs, "limit", 10, 1, 20)
        project_id = inputs.get("project_id")

        q = (
            select(ConstructionMilestone, ConstructionProject.name)
            .join(ConstructionProject, ConstructionMilestone.project_id == ConstructionProject.id)
            .where(
                ConstructionMilestone.due_date < today,
                ConstructionMilestone.status != ConstructionTaskStatus.completed,
            )
            .order_by(ConstructionMilestone.due_date)
            .limit(limit)
        )
        if project_id:
            q = q.where(ConstructionMilestone.project_id == int(project_id))

        result = await db.execute(q)
        rows = result.all()
        return json.dumps([
            {
                "id": row[0].id,
                "project": row[1],
                "title": row[0].title,
                "due_date": str(row[0].due_date),
                "status": row[0].status.value,
                "completion_pct": row[0].completion_pct,
            }
            for row in rows
        ])

    return json.dumps({"error": f"Unknown tool: {name}"})
