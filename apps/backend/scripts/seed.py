"""
Seed script — creates one user per role if they don't already exist.
Run inside the backend container:
    uv run python scripts/seed.py
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.all_models import User  # noqa: F401 — registers all models
from app.models.user import User, UserRole

SEED_USERS = [
    {"username": "admin",      "email": "admin@karakaslar.local",      "password": "admin123",     "role": UserRole.admin},
    {"username": "manager",    "email": "manager@karakaslar.local",    "password": "manager123",   "role": UserRole.manager},
    {"username": "accountant", "email": "accountant@karakaslar.local", "password": "accountant123","role": UserRole.accountant},
    {"username": "employee",   "email": "employee@karakaslar.local",   "password": "employee123",  "role": UserRole.employee},
]


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        for data in SEED_USERS:
            result = await db.execute(select(User).where(User.username == data["username"]))
            if result.scalar_one_or_none():
                print(f"  skip  {data['username']} (already exists)")
                continue

            user = User(
                username=data["username"],
                email=data["email"],
                hashed_password=hash_password(data["password"]),
                role=data["role"],
            )
            db.add(user)
            print(f"  create {data['username']} ({data['role'].value})")

        await db.commit()

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
