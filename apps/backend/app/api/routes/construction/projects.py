import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, ManagerOrAdmin, get_db
from app.models.construction.project import ConstructionProjectStatus, ConstructionProjectType
from app.repositories.construction.audit_log_repository import ConstructionAuditLogRepository
from app.repositories.construction.project_favorite_repository import (
    ConstructionProjectFavoriteRepository,
)
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.audit_log import AuditLogResponse
from app.schemas.construction.project import (
    PaginatedProjectsResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.schemas.construction.project_favorite import FavoriteToggleResponse
from app.services.construction.project_favorite_service import ConstructionProjectFavoriteService
from app.services.construction.project_service import ConstructionProjectService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionProjectService:
    return ConstructionProjectService(
        project_repo=ConstructionProjectRepository(db),
        audit_repo=ConstructionAuditLogRepository(db),
        favorite_repo=ConstructionProjectFavoriteRepository(db),
    )


def _build_audit_response(log) -> AuditLogResponse:
    return AuditLogResponse(
        id=log.id,
        project_id=log.project_id,
        user_id=log.user_id,
        username=log.user.username if log.user else None,
        action=log.action,
        field_name=log.field_name,
        old_value=log.old_value,
        new_value=log.new_value,
        created_at=log.created_at,
    )


@router.get("/", response_model=PaginatedProjectsResponse)
async def list_projects(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: ConstructionProjectStatus | None = None,
    project_type: ConstructionProjectType | None = None,
    location_id: int | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
):
    service = _get_service(db)
    return await service.list_projects(
        current_user_id=current_user.id,
        status=status,
        project_type=project_type,
        location_id=location_id,
        search=search,
        page=page,
        limit=limit,
    )


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.create_project(current_user, body)


@router.get("/export/projects")
async def export_projects_csv(
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from sqlalchemy import func as sa_func
    from app.models.construction.project import ConstructionProject
    from app.models.construction.material import ConstructionMaterial

    result = await db.execute(
        select(ConstructionProject)
        .options(joinedload(ConstructionProject.location), joinedload(ConstructionProject.creator))
        .order_by(ConstructionProject.created_at.desc())
    )
    projects = list(result.scalars().unique().all())

    cost_result = await db.execute(
        select(
            ConstructionMaterial.project_id,
            sa_func.sum(ConstructionMaterial.quantity_used * ConstructionMaterial.unit_cost),
        ).group_by(ConstructionMaterial.project_id)
    )
    actual_costs = {row[0]: float(row[1] or 0) for row in cost_result}

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "ID", "Ad", "Durum", "Tip", "Konum", "Oluşturan",
        "Başlangıç", "Bitiş", "Bütçe (₺)", "Gerçekleşen Maliyet (₺)", "İlerleme (%)", "Oluşturulma",
    ])
    for p in projects:
        writer.writerow([
            p.id, p.name, p.status.value,
            p.project_type.value if p.project_type else "",
            p.location.name if p.location else "",
            p.creator.username if p.creator else "",
            str(p.start_date) if p.start_date else "",
            str(p.end_date) if p.end_date else "",
            str(p.budget) if p.budget else "",
            round(actual_costs.get(p.id, 0), 2),
            p.progress_pct,
            p.created_at.strftime("%Y-%m-%d"),
        ])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=projeler.csv"},
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.get_project(project_id, current_user_id=current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_project(current_user, project_id, body)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    current_user: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_project(current_user, project_id)


@router.post("/{project_id}/favorite", response_model=FavoriteToggleResponse)
async def toggle_favorite(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    svc = ConstructionProjectFavoriteService(ConstructionProjectFavoriteRepository(db))
    return await svc.toggle(current_user.id, project_id)


@router.get("/{project_id}/health")
async def get_project_health(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from datetime import date
    from sqlalchemy import func as sa_func
    from app.models.construction.material import ConstructionMaterial
    from app.models.construction.milestone import ConstructionMilestone, ConstructionTaskStatus
    from app.models.construction.issue import ConstructionIssue, ConstructionIssueSeverity, ConstructionIssueStatus
    from app.models.construction.project import ConstructionProject

    # Fetch project
    proj_res = await db.execute(select(ConstructionProject).where(ConstructionProject.id == project_id))
    project = proj_res.scalar_one_or_none()
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Proje bulunamadı")

    details: list[str] = []
    today = date.today()

    # ── Budget status ─────────────────────────────────────────────────────────
    budget_status = "green"
    if project.budget:
        cost_res = await db.execute(
            select(sa_func.sum(ConstructionMaterial.quantity_used * ConstructionMaterial.unit_cost))
            .where(ConstructionMaterial.project_id == project_id)
        )
        actual_cost = float(cost_res.scalar() or 0)
        budget_pct = (actual_cost / float(project.budget)) * 100 if project.budget else 0
        if budget_pct >= 100:
            budget_status = "red"
            details.append(f"Bütçe aşıldı: gerçekleşen maliyet bütçenin %{round(budget_pct)}i")
        elif budget_pct >= 80:
            budget_status = "amber"
            details.append(f"Bütçe uyarısı: gerçekleşen maliyet bütçenin %{round(budget_pct)}i")
    else:
        budget_status = "green"

    # ── Schedule status ───────────────────────────────────────────────────────
    schedule_status = "green"
    milestones_res = await db.execute(
        select(ConstructionMilestone)
        .where(
            ConstructionMilestone.project_id == project_id,
            ConstructionMilestone.status != ConstructionTaskStatus.completed,
            ConstructionMilestone.due_date != None,  # noqa: E711
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

    # ── Issue status ──────────────────────────────────────────────────────────
    issue_status = "green"
    issues_res = await db.execute(
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

    # ── Overall ───────────────────────────────────────────────────────────────
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


@router.get("/{project_id}/audit-log", response_model=list[AuditLogResponse])
async def get_audit_log(
    project_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    audit_repo = ConstructionAuditLogRepository(db)
    logs = await audit_repo.get_by_project(project_id)
    return [_build_audit_response(log) for log in logs]


@router.get("/{project_id}/export/materials")
async def export_materials_csv(
    project_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from app.models.construction.material import ConstructionMaterial

    result = await db.execute(
        select(ConstructionMaterial)
        .where(ConstructionMaterial.project_id == project_id)
        .order_by(ConstructionMaterial.name)
    )
    materials = result.scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "ID", "Ad", "Tip", "Birim", "Planlanan Miktar", "Kullanılan Miktar",
        "Birim Fiyat (₺)", "Planlanan Maliyet (₺)", "Gerçekleşen Maliyet (₺)", "Notlar",
    ])
    for m in materials:
        planned = float(m.quantity_planned or 0)
        used = float(m.quantity_used or 0)
        cost = float(m.unit_cost or 0)
        writer.writerow([
            m.id, m.name, m.material_type, m.unit.value,
            planned, used, cost,
            round(planned * cost, 2),
            round(used * cost, 2),
            m.notes or "",
        ])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=malzemeler_{project_id}.csv"},
    )


@router.get("/{project_id}/export/milestones")
async def export_milestones_csv(
    project_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from app.models.construction.milestone import ConstructionMilestone

    result = await db.execute(
        select(ConstructionMilestone)
        .where(ConstructionMilestone.project_id == project_id)
        .order_by(ConstructionMilestone.due_date)
    )
    milestones = result.scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["ID", "Başlık", "Durum", "Tamamlanma (%)", "Son Tarih", "Açıklama"])
    for m in milestones:
        writer.writerow([
            m.id, m.title, m.status.value, m.completion_pct,
            str(m.due_date) if m.due_date else "",
            m.description or "",
        ])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=asamalar_{project_id}.csv"},
    )
