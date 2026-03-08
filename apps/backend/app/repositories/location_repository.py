from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.location import Location, user_locations
from app.models.user import User


class LocationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all(self) -> list[Location]:
        result = await self.db.execute(
            select(Location).options(selectinload(Location.users)).order_by(Location.name)
        )
        return list(result.scalars().unique().all())

    async def get_by_id(self, location_id: int) -> Location | None:
        result = await self.db.execute(
            select(Location)
            .options(selectinload(Location.users))
            .where(Location.id == location_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Location | None:
        result = await self.db.execute(select(Location).where(Location.name == name))
        return result.scalar_one_or_none()

    async def create(self, name: str, address: str | None) -> Location:
        loc = Location(name=name, address=address)
        self.db.add(loc)
        await self.db.commit()
        await self.db.refresh(loc)
        return loc

    async def update(self, location: Location, name: str | None, address: str | None) -> Location:
        if name is not None:
            location.name = name
        if address is not None:
            location.address = address
        await self.db.commit()
        await self.db.refresh(location)
        return location

    async def delete(self, location: Location) -> None:
        await self.db.delete(location)
        await self.db.commit()

    async def assign_user(self, user_id: int, location_id: int) -> None:
        stmt = insert(user_locations).values(user_id=user_id, location_id=location_id).prefix_with("OR IGNORE")
        # Use ON CONFLICT DO NOTHING for PostgreSQL
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        stmt = pg_insert(user_locations).values(user_id=user_id, location_id=location_id).on_conflict_do_nothing()
        await self.db.execute(stmt)
        await self.db.commit()

    async def remove_user(self, user_id: int, location_id: int) -> None:
        await self.db.execute(
            delete(user_locations).where(
                user_locations.c.user_id == user_id,
                user_locations.c.location_id == location_id,
            )
        )
        await self.db.commit()

    async def get_location_ids_for_user(self, user_id: int) -> list[int]:
        result = await self.db.execute(
            select(user_locations.c.location_id).where(user_locations.c.user_id == user_id)
        )
        return [row[0] for row in result.all()]

    async def get_users_for_location(self, location_id: int) -> list[User]:
        result = await self.db.execute(
            select(User)
            .join(user_locations, User.id == user_locations.c.user_id)
            .where(user_locations.c.location_id == location_id)
            .order_by(User.username)
        )
        return list(result.scalars().unique().all())
