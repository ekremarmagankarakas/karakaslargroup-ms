import math

from fastapi import HTTPException

from app.models.user import User
from app.repositories.construction.daily_log_repository import ConstructionDailyLogRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.daily_log import (
    DailyLogCreate,
    DailyLogResponse,
    DailyLogUpdate,
    PaginatedDailyLogsResponse,
)


def _build_log_response(log) -> DailyLogResponse:
    return DailyLogResponse(
        id=log.id,
        project_id=log.project_id,
        log_date=log.log_date,
        weather=log.weather,
        temperature_c=log.temperature_c,
        worker_count=log.worker_count,
        work_summary=log.work_summary,
        equipment_on_site=log.equipment_on_site,
        visitors=log.visitors,
        recorded_by=log.recorded_by,
        recorder_username=log.recorder.username if log.recorder else None,
        created_at=log.created_at,
    )


class ConstructionDailyLogService:
    def __init__(
        self,
        log_repo: ConstructionDailyLogRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.log_repo = log_repo
        self.project_repo = project_repo

    async def list_daily_logs(
        self, project_id: int, page: int = 1, limit: int = 20
    ) -> PaginatedDailyLogsResponse:
        logs, total = await self.log_repo.get_by_project(project_id, page=page, limit=limit)
        total_pages = math.ceil(total / limit) if limit else 1
        return PaginatedDailyLogsResponse(
            items=[_build_log_response(l) for l in logs],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def create_daily_log(
        self, current_user: User, project_id: int, body: DailyLogCreate
    ) -> DailyLogResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

        existing = await self.log_repo.get_by_date(project_id, body.log_date)
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"{body.log_date} tarihi için günlük kaydı zaten mevcut",
            )

        log = await self.log_repo.create(
            {
                "project_id": project_id,
                "log_date": body.log_date,
                "weather": body.weather,
                "temperature_c": body.temperature_c,
                "worker_count": body.worker_count,
                "work_summary": body.work_summary,
                "equipment_on_site": body.equipment_on_site,
                "visitors": body.visitors,
                "recorded_by": current_user.id,
            }
        )
        return _build_log_response(log)

    async def update_daily_log(
        self, current_user: User, project_id: int, log_id: int, body: DailyLogUpdate
    ) -> DailyLogResponse:
        log = await self.log_repo.get_by_id(log_id)
        if not log or log.project_id != project_id:
            raise HTTPException(status_code=404, detail="Günlük kaydı bulunamadı")

        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        log = await self.log_repo.update(log, update_data)
        return _build_log_response(log)

    async def delete_daily_log(
        self, current_user: User, project_id: int, log_id: int
    ) -> None:
        log = await self.log_repo.get_by_id(log_id)
        if not log or log.project_id != project_id:
            raise HTTPException(status_code=404, detail="Günlük kaydı bulunamadı")
        await self.log_repo.delete(log)
