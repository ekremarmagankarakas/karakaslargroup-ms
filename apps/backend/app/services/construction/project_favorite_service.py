from app.repositories.construction.project_favorite_repository import (
    ConstructionProjectFavoriteRepository,
)
from app.schemas.construction.project_favorite import FavoriteToggleResponse


class ConstructionProjectFavoriteService:
    def __init__(self, repo: ConstructionProjectFavoriteRepository) -> None:
        self.repo = repo

    async def toggle(self, user_id: int, project_id: int) -> FavoriteToggleResponse:
        existing = await self.repo.get_by_user_and_project(user_id, project_id)
        if existing:
            await self.repo.remove(existing)
            return FavoriteToggleResponse(is_favorite=False)
        await self.repo.add(user_id, project_id)
        return FavoriteToggleResponse(is_favorite=True)
