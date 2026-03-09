from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


class CategoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all(self) -> list[Category]:
        result = await self.db.execute(select(Category).order_by(Category.name))
        return list(result.scalars().all())

    async def get_by_id(self, category_id: int) -> Category | None:
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

    async def create(self, name: str, color: str | None = None) -> Category:
        cat = Category(name=name, color=color)
        self.db.add(cat)
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    async def update(self, cat: Category, name: str | None, color: str | None) -> Category:
        if name is not None:
            cat.name = name
        if color is not None:
            cat.color = color
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    async def delete(self, cat: Category) -> None:
        await self.db.delete(cat)
        await self.db.commit()
