"""
Construction notification management endpoints.
GET /check-permits — scans permits expiring in 30 days and creates notifications.
"""

from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, get_db
from app.models.construction.permit import ConstructionPermit, PermitStatus
from app.models.construction.project import ConstructionProject
from app.services.construction.notification_service import notify_permit_expiring

router = APIRouter()

PERMIT_TYPE_LABELS = {
    "construction": "İnşaat Ruhsatı",
    "demolition": "Yıkım Ruhsatı",
    "electrical": "Elektrik Ruhsatı",
    "plumbing": "Tesisat Ruhsatı",
    "fire_safety": "Yangın Güvenliği",
    "environmental": "Çevre İzni",
    "occupancy": "İskân Ruhsatı",
    "other": "Diğer İzin",
}


class CheckPermitsResponse(BaseModel):
    checked: int
    notifications_sent: int


@router.get("/check-permits", response_model=CheckPermitsResponse)
async def check_permits(
    current_user: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    today = date.today()
    deadline = today + timedelta(days=30)

    result = await db.execute(
        select(ConstructionPermit, ConstructionProject.name)
        .join(ConstructionProject, ConstructionPermit.project_id == ConstructionProject.id)
        .where(
            ConstructionPermit.status == PermitStatus.approved,
            ConstructionPermit.expiry_date != None,  # noqa: E711
            ConstructionPermit.expiry_date >= today,
            ConstructionPermit.expiry_date <= deadline,
        )
    )
    rows = result.all()

    notifications_sent = 0
    for permit, project_name in rows:
        days_remaining = (permit.expiry_date - today).days
        permit_label = PERMIT_TYPE_LABELS.get(permit.permit_type.value, permit.permit_type.value)
        await notify_permit_expiring(
            db=db,
            permit_type=permit_label,
            project_name=project_name,
            days_remaining=days_remaining,
        )
        notifications_sent += 1

    return CheckPermitsResponse(checked=len(rows), notifications_sent=notifications_sent)
