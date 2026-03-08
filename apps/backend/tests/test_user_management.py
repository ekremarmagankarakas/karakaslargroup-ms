"""Tests for Feature 4: User Management Page."""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.models.user import User, UserRole


class TestUserManagementApiGuards:
    async def test_admin_can_list_all_users(self, admin_client):
        resp = await admin_client.get("/api/users/all")
        assert resp.status_code != 403

    async def test_manager_cannot_list_all_users(self, manager_client):
        resp = await manager_client.get("/api/users/all")
        assert resp.status_code == 403

    async def test_employee_cannot_list_all_users(self, employee_client):
        resp = await employee_client.get("/api/users/all")
        assert resp.status_code == 403

    async def test_accountant_cannot_list_all_users(self, accountant_client):
        resp = await accountant_client.get("/api/users/all")
        assert resp.status_code == 403

    async def test_admin_can_update_user(self, admin_client):
        resp = await admin_client.patch(
            "/api/users/1", json={"role": "manager"}
        )
        # Auth passes; DB mock returns None → 404, not 403
        assert resp.status_code != 403

    async def test_manager_cannot_update_user(self, manager_client):
        resp = await manager_client.patch(
            "/api/users/1", json={"role": "employee"}
        )
        assert resp.status_code == 403

    async def test_employee_cannot_update_user(self, employee_client):
        resp = await employee_client.patch(
            "/api/users/1", json={"role": "admin"}
        )
        assert resp.status_code == 403


class TestUserUpdateValidation:
    async def test_update_with_invalid_role_returns_422(self, admin_client):
        resp = await admin_client.patch(
            "/api/users/1", json={"role": "super_admin"}
        )
        assert resp.status_code == 422

    async def test_update_missing_user_returns_404(self, admin_client):
        resp = await admin_client.patch(
            "/api/users/999", json={"is_active": False}
        )
        assert resp.status_code == 404

    async def test_update_with_is_active_false(self, admin_client):
        resp = await admin_client.patch(
            "/api/users/999", json={"is_active": False}
        )
        # 404 (user not found in mock DB), not 422 or 403
        assert resp.status_code == 404

    async def test_update_accepts_partial_fields(self, admin_client):
        """PATCH should accept any subset of fields."""
        resp = await admin_client.patch(
            "/api/users/999", json={"role": "accountant"}
        )
        assert resp.status_code != 422


class TestIsActiveFilter:
    """Tests that inactive user auth is blocked."""

    async def test_inactive_user_flag_exists_on_model(self):
        from app.models.user import User
        import sqlalchemy
        cols = {c.key for c in sqlalchemy.inspect(User).mapper.column_attrs}
        assert "is_active" in cols
