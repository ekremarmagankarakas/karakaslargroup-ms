import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class RequirementStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(500), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RequirementStatus] = mapped_column(
        SAEnum(RequirementStatus, name="requirement_status"),
        default=RequirementStatus.pending,
    )
    paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        foreign_keys=[user_id], back_populates="requirements"
    )
    approver: Mapped["User | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        foreign_keys=[approved_by]
    )
    images: Mapped[list["RequirementImage"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="requirement", cascade="all, delete-orphan"
    )
    favorites: Mapped[list["Favorite"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="requirement", cascade="all, delete-orphan"
    )
    comments: Mapped[list["RequirementComment"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="requirement", cascade="all, delete-orphan"
    )
