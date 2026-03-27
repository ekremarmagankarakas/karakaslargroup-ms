from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.schemas.construction.analytics import ConstructionAnalyticsResponse, SCurvePoint
from app.services.construction.analytics_service import ConstructionAnalyticsService

router = APIRouter()


@router.get("/analytics", response_model=ConstructionAnalyticsResponse)
async def get_construction_analytics(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConstructionAnalyticsResponse:
    return await ConstructionAnalyticsService(db).get_analytics()


@router.get("/{project_id}/s-curve", response_model=list[SCurvePoint])
async def get_s_curve(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SCurvePoint]:
    return await ConstructionAnalyticsService(db).get_s_curve(project_id)
