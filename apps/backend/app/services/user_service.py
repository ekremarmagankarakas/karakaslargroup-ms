from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse


class UserService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def create_user(self, payload: UserCreate) -> UserResponse:
        existing_username = await self.user_repo.get_by_username(payload.username)
        if existing_username:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

        existing_email = await self.user_repo.get_by_email(payload.email)
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        user = await self.user_repo.create(
            username=payload.username,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
        )
        return UserResponse.model_validate(user)

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        await self.user_repo.update_password(user, hash_password(new_password))
