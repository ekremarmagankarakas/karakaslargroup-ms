"""Integration tests for role-based access guards on API endpoints.

Uses ASGITransport + dependency overrides (no real DB).
"""
import pytest


class TestUnauthenticated:
    async def test_requirements_list_requires_auth(self, anon_client):
        resp = await anon_client.get("/api/requirements/")
        assert resp.status_code in (401, 403)

    async def test_statistics_requires_auth(self, anon_client):
        resp = await anon_client.get("/api/statistics/")
        assert resp.status_code in (401, 403)

    async def test_users_list_requires_auth(self, anon_client):
        resp = await anon_client.get("/api/users/")
        assert resp.status_code in (401, 403)

    async def test_chat_requires_auth(self, anon_client):
        resp = await anon_client.post("/api/chat/", json={"messages": []})
        assert resp.status_code in (401, 403)


class TestTopRequestersRoleGuard:
    async def test_employee_cannot_access_top_requesters(self, employee_client):
        resp = await employee_client.get("/api/statistics/top-requesters")
        assert resp.status_code == 403

    async def test_manager_can_access_top_requesters(self, manager_client):
        # Response will fail on DB call (mocked), but should pass auth check.
        # We check it's not 403.
        resp = await manager_client.get("/api/statistics/top-requesters")
        assert resp.status_code != 403

    async def test_accountant_can_access_top_requesters(self, accountant_client):
        resp = await accountant_client.get("/api/statistics/top-requesters")
        assert resp.status_code != 403

    async def test_admin_can_access_top_requesters(self, admin_client):
        resp = await admin_client.get("/api/statistics/top-requesters")
        assert resp.status_code != 403


class TestUsersEndpointRoleGuard:
    async def test_employee_cannot_list_users(self, employee_client):
        resp = await employee_client.get("/api/users/")
        assert resp.status_code == 403

    async def test_manager_can_list_users(self, manager_client):
        resp = await manager_client.get("/api/users/")
        assert resp.status_code != 403
