from pydantic import BaseModel


class FavoriteToggleResponse(BaseModel):
    is_favorite: bool
