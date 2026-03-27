from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ConstructionPhoto(Base):
    __tablename__ = "construction_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_key: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="photos")  # type: ignore[name-defined]  # noqa: F821
    uploader: Mapped["User | None"] = relationship(foreign_keys=[uploaded_by])  # type: ignore[name-defined]  # noqa: F821
