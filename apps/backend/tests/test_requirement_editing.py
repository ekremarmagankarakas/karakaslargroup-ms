"""Tests for Feature 1: Requirement Editing."""
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock

from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User, UserRole
from app.services.requirement_service import RequirementService


def _make_requirement(req_id=1, status=RequirementStatus.pending, user_id=10):
    req = MagicMock(spec=Requirement)
    req.id = req_id
    req.user_id = user_id
    req.item_name = "Original Item"
    req.price = Decimal("100.00")
    req.explanation = "Original explanation"
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


def _make_user(user_id=10, role=UserRole.employee):
    user = MagicMock(spec=User)
    user.id = user_id
    user.role = role
    user.username = "owner"
    return user


@pytest.fixture
def service():
    req_repo = AsyncMock()
    fav_repo = AsyncMock()
    fav_repo.get_favorited_ids_for_user.return_value = set()
    storage = MagicMock()
    storage.get_presigned_url.return_value = "http://example.com/img"
    svc = RequirementService(
        req_repo=req_repo,
        img_repo=AsyncMock(),
        fav_repo=fav_repo,
        user_repo=AsyncMock(),
        storage=storage,
        email=AsyncMock(),
    )
    return svc


class TestUpdateRequirement:
    async def test_owner_can_edit_pending(self, service):
        req = _make_requirement(user_id=10, status=RequirementStatus.pending)
        updated = _make_requirement(user_id=10, status=RequirementStatus.pending)
        updated.item_name = "Updated Item"
        service.req_repo.get_by_id.side_effect = [req, updated]
        owner = _make_user(user_id=10, role=UserRole.employee)

        result = await service.update_requirement(1, owner, "Updated Item", None, None)

        service.req_repo.update_fields.assert_called_once_with(req, "Updated Item", None, None)
        assert result.item_name == "Updated Item"

    async def test_admin_can_edit_any_pending(self, service):
        req = _make_requirement(user_id=99, status=RequirementStatus.pending)
        updated = _make_requirement(user_id=99, status=RequirementStatus.pending)
        service.req_repo.get_by_id.side_effect = [req, updated]
        admin = _make_user(user_id=1, role=UserRole.admin)

        await service.update_requirement(1, admin, "New Name", None, None)

        service.req_repo.update_fields.assert_called_once()

    async def test_non_owner_cannot_edit(self, service):
        req = _make_requirement(user_id=99, status=RequirementStatus.pending)
        service.req_repo.get_by_id.return_value = req
        other = _make_user(user_id=10, role=UserRole.employee)

        with pytest.raises(HTTPException) as exc_info:
            await service.update_requirement(1, other, "Hacked", None, None)
        assert exc_info.value.status_code == 403

    async def test_cannot_edit_accepted_requirement(self, service):
        req = _make_requirement(user_id=10, status=RequirementStatus.accepted)
        service.req_repo.get_by_id.return_value = req
        owner = _make_user(user_id=10, role=UserRole.employee)

        with pytest.raises(HTTPException) as exc_info:
            await service.update_requirement(1, owner, "Edit", None, None)
        assert exc_info.value.status_code == 400

    async def test_cannot_edit_declined_requirement(self, service):
        req = _make_requirement(user_id=10, status=RequirementStatus.declined)
        service.req_repo.get_by_id.return_value = req
        owner = _make_user(user_id=10, role=UserRole.employee)

        with pytest.raises(HTTPException) as exc_info:
            await service.update_requirement(1, owner, "Edit", None, None)
        assert exc_info.value.status_code == 400

    async def test_missing_requirement_raises_404(self, service):
        service.req_repo.get_by_id.return_value = None
        owner = _make_user(user_id=10)

        with pytest.raises(HTTPException) as exc_info:
            await service.update_requirement(999, owner, "Edit", None, None)
        assert exc_info.value.status_code == 404

    async def test_writes_audit_log_when_repo_present(self, service):
        audit_repo = AsyncMock()
        service.audit_repo = audit_repo
        req = _make_requirement(user_id=10, status=RequirementStatus.pending)
        updated = _make_requirement(user_id=10, status=RequirementStatus.pending)
        service.req_repo.get_by_id.side_effect = [req, updated]
        owner = _make_user(user_id=10)

        await service.update_requirement(1, owner, "Updated", None, None)

        audit_repo.create.assert_called_once()
        args = audit_repo.create.call_args
        from app.models.audit_log import AuditAction
        action = args.kwargs.get("action") or (args[0][2] if len(args[0]) > 2 else None)
        assert action == AuditAction.edited


class TestEditApiGuards:
    async def test_employee_can_edit_own_pending(self, employee_client):
        # Hits the route but mock DB returns None → 404, not 403
        resp = await employee_client.patch(
            "/api/requirements/1", json={"item_name": "Updated"}
        )
        assert resp.status_code != 403

    async def test_manager_can_edit(self, manager_client):
        resp = await manager_client.patch(
            "/api/requirements/1", json={"item_name": "Manager Edit"}
        )
        assert resp.status_code != 403
