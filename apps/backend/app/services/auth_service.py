import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.repositories.password_reset_repository import PasswordResetRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AccessTokenResponse, TokenResponse
from app.schemas.user import UserResponse
from app.services.email_service import EmailService


class AuthService:
    def __init__(self, user_repo: UserRepository, reset_repo: PasswordResetRepository | None = None, email: EmailService | None = None) -> None:
        self.user_repo = user_repo
        self.reset_repo = reset_repo
        self.email = email

    async def login(self, username: str, password: str) -> TokenResponse:
        user = await self.user_repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")
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

    async def forgot_password(self, email: str) -> None:
        if not self.reset_repo or not self.email:
            return
        user = await self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            # Don't reveal whether the email exists
            return
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.reset_repo.create(user.id, token_hash, expires_at)
        await self.email.send_password_reset(user.email, raw_token)

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        if not self.reset_repo:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset not configured")
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        token = await self.reset_repo.get_by_hash(token_hash)
        if not token or token.used:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
        expires = token.expires_at if token.expires_at.tzinfo else token.expires_at.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired")
        user = await self.user_repo.get_by_id(token.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
        await self.user_repo.update_password(user, hash_password(new_password))
        await self.reset_repo.mark_used(token)
