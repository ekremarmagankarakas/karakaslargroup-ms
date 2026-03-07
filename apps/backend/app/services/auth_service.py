from fastapi import HTTPException, status

from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AccessTokenResponse, TokenResponse
from app.schemas.user import UserResponse


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def login(self, username: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    async def refresh(self, refresh_token: str) -> AccessTokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user = await self.user_repo.get_by_id(int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        access_token = create_access_token(user.id, user.role.value)
        return AccessTokenResponse(access_token=access_token)
