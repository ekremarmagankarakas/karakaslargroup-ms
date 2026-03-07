import enum
from datetime import datetime

from sqlalchemy import Enum as SAEnum, String
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class UserRole(str, enum.Enum):
    employee = "employee"
    manager = "manager"
    accountant = "accountant"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), default=UserRole.employee)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    requirements: Mapped[list["Requirement"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="user", foreign_keys="Requirement.user_id"
    )
    favorites: Mapped[list["Favorite"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="user"
    )
