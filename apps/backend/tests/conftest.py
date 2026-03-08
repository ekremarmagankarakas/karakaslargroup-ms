"""
Shared fixtures for the test suite.

Strategy:
- Set required env vars BEFORE importing app modules (Settings uses lru_cache).
- Override FastAPI deps (get_db, get_current_user) so tests never touch a real DB.
- Provide role-specific authenticated AsyncClient fixtures.
"""
import os

# Must be set before any app import so pydantic-settings resolves them.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("SMTP_USERNAME", "test@example.com")
os.environ.setdefault("SMTP_PASSWORD", "test-password")
os.environ.setdefault("SMTP_FROM_EMAIL", "test@example.com")

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock

from app.core.config import get_settings
from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.main import app


get_settings.cache_clear()


def make_user(role: UserRole, user_id: int = 1) -> User:
    user = MagicMock(spec=User)
    user.id = user_id
    user.username = f"{role.value}_user"
    user.email = f"{role.value}@example.com"
    user.role = role
    user.hashed_password = "hashed"
    return user


@pytest.fixture
def employee_user():
    return make_user(UserRole.employee)


@pytest.fixture
def manager_user():
    return make_user(UserRole.manager, user_id=2)


@pytest.fixture
def admin_user():
    return make_user(UserRole.admin, user_id=3)


@pytest.fixture
def accountant_user():
    return make_user(UserRole.accountant, user_id=4)


def _make_mock_db() -> AsyncMock:
    """Create a mock DB session whose execute() returns a properly configured MagicMock."""
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_result.first.return_value = None
    mock_result.scalar_one_or_none.return_value = None
    mock_result.scalar.return_value = 0
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = []
    scalars_mock.first.return_value = None
    mock_result.scalars.return_value = scalars_mock

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.delete = AsyncMock()
    mock_db.get = AsyncMock(return_value=None)
    return mock_db


def _make_client(user: User) -> AsyncClient:
    """Return an AsyncClient with get_current_user and get_db overridden."""
    mock_db = _make_mock_db()

    async def _get_user():
        return user

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _get_user
    app.dependency_overrides[get_db] = _get_db

    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def employee_client(employee_user):
    async with _make_client(employee_user) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def manager_client(manager_user):
    async with _make_client(manager_user) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def admin_client(admin_user):
    async with _make_client(admin_user) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def accountant_client(accountant_user):
    async with _make_client(accountant_user) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def anon_client():
    """Unauthenticated client — no dependency overrides."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
async def no_auth_client():
    """Unauthenticated client with mocked DB (for open endpoints like password reset)."""
    mock_db = _make_mock_db()

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.pop(get_db, None)
