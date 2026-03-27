from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.construction.daily_log import WeatherCondition


class DailyLogCreate(BaseModel):
    log_date: date
    weather: WeatherCondition = WeatherCondition.sunny
    temperature_c: int | None = None
    worker_count: int = 0
    work_summary: str
    equipment_on_site: str | None = None
    visitors: str | None = None


class DailyLogUpdate(BaseModel):
    weather: WeatherCondition | None = None
    temperature_c: int | None = None
    worker_count: int | None = None
    work_summary: str | None = None
    equipment_on_site: str | None = None
    visitors: str | None = None


class DailyLogResponse(BaseModel):
    id: int
    project_id: int
    log_date: date
    weather: WeatherCondition
    temperature_c: int | None
    worker_count: int
    work_summary: str
    equipment_on_site: str | None
    visitors: str | None
    recorded_by: int | None
    recorder_username: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedDailyLogsResponse(BaseModel):
    items: list[DailyLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int
