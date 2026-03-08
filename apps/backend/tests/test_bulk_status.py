"""Tests for Feature 3: Bulk Status Actions."""
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User, UserRole
from app.services.requirement_service import RequirementService


def _make_requirement(req_id=1, status=RequirementStatus.pending, user_id=10):
    req = MagicMock(spec=Requirement)
    req.id = req_id
    req.user_id = user_id
    req.item_name = f"Item {req_id}"
    req.price = Decimal("100.00")
    req.explanation = None
    req.status = status
    req.paid = False
    req.approved_by = None
    req.images = []
    req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    req.user = MagicMock()
    req.user.username = "owner"
    req.approver = None
    req.location = None
    return req


def _make_user(user_id=2, role=UserRole.manager):
    user = MagicMock(spec=User)
    user.id = user_id
    user.role = role
    user.email = "manager@example.com"
    user.username = "manager"
    return user


@pytest.fixture
def service():
    req_repo = AsyncMock()
    fav_repo = AsyncMock()
    fav_repo.get_favorited_ids_for_user.return_value = set()
    user_repo = AsyncMock()
    user_repo.get_by_id.return_value = _make_user()
    user_repo.get_emails_by_roles.return_value = []
    storage = MagicMock()
    storage.get_presigned_url.return_value = "http://example.com/img"
    svc = RequirementService(
        req_repo=req_repo,
        img_repo=AsyncMock(),
        fav_repo=fav_repo,
        user_repo=user_repo,
        storage=storage,
        email=AsyncMock(),
    )
    return svc


class TestBulkUpdateStatus:
    async def test_bulk_accept_multiple_ids(self, service):
        req1 = _make_requirement(1, RequirementStatus.pending)
        req1_accepted = _make_requirement(1, RequirementStatus.accepted)
        req2 = _make_requirement(2, RequirementStatus.pending)
        req2_accepted = _make_requirement(2, RequirementStatus.accepted)
        service.req_repo.get_by_id.side_effect = [
            req1, req1_accepted,
            req2, req2_accepted,
        ]
        manager = _make_user()
        bg = MagicMock()
        bg.add_task = MagicMock()

        results = await service.bulk_update_status([1, 2], RequirementStatus.accepted, manager, bg)

        assert len(results) == 2
        assert service.req_repo.update_status.call_count == 2

    async def test_bulk_decline(self, service):
        req1 = _make_requirement(1, RequirementStatus.pending)
        req1_declined = _make_requirement(1, RequirementStatus.declined)
        service.req_repo.get_by_id.side_effect = [req1, req1_declined]
        manager = _make_user()
        bg = MagicMock()
        bg.add_task = MagicMock()

        results = await service.bulk_update_status([1], RequirementStatus.declined, manager, bg)

        assert len(results) == 1
        service.req_repo.update_status.assert_called_once_with(
            req1, RequirementStatus.declined, manager.id
        )

    async def test_bulk_skips_missing_requirements(self, service):
        service.req_repo.get_by_id.return_value = None
        manager = _make_user()
        bg = MagicMock()
        bg.add_task = MagicMock()

        results = await service.bulk_update_status([999, 998], RequirementStatus.accepted, manager, bg)

        # Missing requirements are skipped, returns empty list
        assert results == []

    async def test_bulk_empty_ids_returns_empty(self, service):
        manager = _make_user()
        bg = MagicMock()
        bg.add_task = MagicMock()

        results = await service.bulk_update_status([], RequirementStatus.accepted, manager, bg)

        assert results == []
        service.req_repo.update_status.assert_not_called()


class TestBulkStatusApiGuards:
    async def test_employee_cannot_bulk_update(self, employee_client):
        resp = await employee_client.patch(
            "/api/requirements/bulk-status",
            json={"ids": [1, 2], "status": "accepted"},
        )
        assert resp.status_code == 403

    async def test_manager_can_bulk_update(self, manager_client):
        resp = await manager_client.patch(
            "/api/requirements/bulk-status",
            json={"ids": [1], "status": "accepted"},
        )
        assert resp.status_code != 403

    async def test_admin_can_bulk_update(self, admin_client):
        resp = await admin_client.patch(
            "/api/requirements/bulk-status",
            json={"ids": [1], "status": "declined"},
        )
        assert resp.status_code != 403

    async def test_accountant_cannot_bulk_update(self, accountant_client):
        resp = await accountant_client.patch(
            "/api/requirements/bulk-status",
            json={"ids": [1], "status": "accepted"},
        )
        assert resp.status_code == 403

    async def test_invalid_status_returns_422(self, manager_client):
        resp = await manager_client.patch(
            "/api/requirements/bulk-status",
            json={"ids": [1], "status": "invalid_status"},
        )
        assert resp.status_code == 422
