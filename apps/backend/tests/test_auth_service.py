"""Unit tests for AuthService — repositories are mocked."""
import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.services.auth_service import AuthService


def _make_db_user(user_id: int = 1, role: UserRole = UserRole.employee, password: str = "secret") -> MagicMock:
    user = MagicMock(spec=User)
    user.id = user_id
    user.username = "testuser"
    user.email = "test@example.com"
    user.role = role
    user.hashed_password = hash_password(password)
    return user


@pytest.fixture
def user_repo():
    return AsyncMock()


@pytest.fixture
def auth_service(user_repo):
    return AuthService(user_repo=user_repo)


class TestLogin:
    async def test_success_returns_tokens(self, auth_service, user_repo):
        user_repo.get_by_username.return_value = _make_db_user(password="mypass")
        result = await auth_service.login("testuser", "mypass")
        assert result.access_token
        assert result.refresh_token
        assert result.user.username == "testuser"

    async def test_wrong_password_raises_401(self, auth_service, user_repo):
        user_repo.get_by_username.return_value = _make_db_user(password="correct")
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login("testuser", "wrong")
        assert exc_info.value.status_code == 401

    async def test_unknown_user_raises_401(self, auth_service, user_repo):
        user_repo.get_by_username.return_value = None
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login("nobody", "pass")
        assert exc_info.value.status_code == 401


class TestRefresh:
    async def test_valid_refresh_token_returns_access(self, auth_service, user_repo):
        from app.core.security import create_refresh_token

        db_user = _make_db_user(user_id=5, role=UserRole.manager)
        user_repo.get_by_id.return_value = db_user
        refresh_token = create_refresh_token(user_id=5)

        result = await auth_service.refresh(refresh_token)
        assert result.access_token

    async def test_access_token_used_as_refresh_raises_401(self, auth_service, user_repo):
        from app.core.security import create_access_token

        token = create_access_token(user_id=1, role="employee")
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh(token)
        assert exc_info.value.status_code == 401

    async def test_refresh_for_deleted_user_raises_401(self, auth_service, user_repo):
        from app.core.security import create_refresh_token

        user_repo.get_by_id.return_value = None
        token = create_refresh_token(user_id=999)
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh(token)
        assert exc_info.value.status_code == 401
