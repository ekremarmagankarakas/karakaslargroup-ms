from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.db.get(User, user_id)

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all(self, active_only: bool = True) -> list[User]:
        stmt = select(User).order_by(User.username)
        if active_only:
            stmt = stmt.where(User.is_active == True)  # noqa: E712
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, username: str, email: str, hashed_password: str, role: UserRole) -> User:
        user = User(username=username, email=email, hashed_password=hashed_password, role=role)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_password(self, user: User, hashed_password: str) -> None:
        user.hashed_password = hashed_password
        await self.db.commit()

    async def update_user(self, user: User, role: "UserRole | None", email: str | None, is_active: bool | None) -> User:
        if role is not None:
            user.role = role
        if email is not None:
            user.email = email
        if is_active is not None:
            user.is_active = is_active
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_active_by_username(self, username: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.username == username, User.is_active == True)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def get_emails_by_roles(self, roles: list[str]) -> list[str]:
        result = await self.db.execute(
            select(User.email).where(User.role.in_(roles), User.is_active == True)  # noqa: E712
        )
        return list(result.scalars().all())

    async def get_users_by_roles(self, roles: list[str]) -> list[User]:
        result = await self.db.execute(
            select(User).where(User.role.in_(roles), User.is_active == True)  # noqa: E712
        )
        return list(result.scalars().all())
