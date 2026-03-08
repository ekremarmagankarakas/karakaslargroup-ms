from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.password_reset_repository import PasswordResetRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AccessTokenResponse, ForgotPasswordRequest, LoginRequest, RefreshRequest, ResetPasswordRequest, TokenResponse
from app.services.auth_service import AuthService
from app.services.email_service import EmailService

router = APIRouter()


def _get_service(db: AsyncSession) -> AuthService:
    return AuthService(
        user_repo=UserRepository(db),
        reset_repo=PasswordResetRepository(db),
        email=EmailService(),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    service = _get_service(db)
    return await service.login(body.username, body.password)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    service = _get_service(db)
    return await service.refresh(body.refresh_token)


@router.post("/forgot-password", status_code=204)
async def forgot_password(body: ForgotPasswordRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    service = _get_service(db)
    await service.forgot_password(body.email)


@router.post("/reset-password", status_code=204)
async def reset_password(body: ResetPasswordRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    service = _get_service(db)
    await service.reset_password(body.token, body.new_password)
