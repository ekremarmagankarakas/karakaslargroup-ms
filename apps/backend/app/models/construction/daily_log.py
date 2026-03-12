import enum
from datetime import date, datetime

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class WeatherCondition(str, enum.Enum):
    sunny = "sunny"
    cloudy = "cloudy"
    rainy = "rainy"
    stormy = "stormy"
    snowy = "snowy"


class ConstructionDailyLog(Base):
    __tablename__ = "construction_daily_logs"
    __table_args__ = (UniqueConstraint("project_id", "log_date", name="uq_daily_log_project_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    weather: Mapped[WeatherCondition] = mapped_column(SAEnum(WeatherCondition, name="weather_condition"), nullable=False, default=WeatherCondition.sunny)
    temperature_c: Mapped[int | None] = mapped_column(Integer, nullable=True)
    worker_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    work_summary: Mapped[str] = mapped_column(Text, nullable=False)
    equipment_on_site: Mapped[str | None] = mapped_column(Text)
    visitors: Mapped[str | None] = mapped_column(Text)
    recorded_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="daily_logs")  # type: ignore[name-defined]  # noqa: F821
    recorder: Mapped["User | None"] = relationship(foreign_keys=[recorded_by])  # type: ignore[name-defined]  # noqa: F821
