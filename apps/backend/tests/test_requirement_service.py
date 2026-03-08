"""Unit tests for RequirementService — focuses on toggle logic and 404 handling."""
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User, UserRole
from app.services.requirement_service import RequirementService


def _make_requirement(req_id: int = 1, status: RequirementStatus = RequirementStatus.pending, user_id: int = 10) -> MagicMock:
    req = MagicMock(spec=Requirement)
    req.id = req_id
    req.user_id = user_id
    req.item_name = "Test Item"
    req.price = Decimal("100.00")
    req.explanation = "Test explanation"
    req.status = status
    req.paid = False
    req.approved_by = None
    req.images = []
    req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    req.user = MagicMock()
    req.user.username = "employee_user"
    req.approver = None
    return req


def _make_user(user_id: int = 99, role: UserRole = UserRole.manager) -> MagicMock:
    user = MagicMock(spec=User)
    user.id = user_id
    user.role = role
    user.email = "manager@example.com"
    user.username = "manager"
    return user


@pytest.fixture
def service():
    req_repo = AsyncMock()
    img_repo = AsyncMock()
    fav_repo = AsyncMock()
    user_repo = AsyncMock()
    storage = MagicMock()
    email = AsyncMock()

    storage.get_presigned_url.return_value = "http://example.com/img"
    fav_repo.get_favorited_ids_for_user.return_value = set()
    user_repo.get_by_id.return_value = _make_user()
    user_repo.get_emails_by_roles.return_value = []

    svc = RequirementService(
        req_repo=req_repo,
        img_repo=img_repo,
        fav_repo=fav_repo,
        user_repo=user_repo,
        storage=storage,
        email=email,
    )
    return svc


class TestUpdateStatusToggle:
    async def test_accept_pending_sets_accepted(self, service):
        req = _make_requirement(status=RequirementStatus.pending)
        accepted_req = _make_requirement(status=RequirementStatus.accepted)
        service.req_repo.get_by_id.side_effect = [req, accepted_req]

        manager = _make_user(role=UserRole.manager)
        bg = MagicMock()
        bg.add_task = MagicMock()

        await service.update_status(1, RequirementStatus.accepted, manager, bg)

        service.req_repo.update_status.assert_called_once_with(
            req, RequirementStatus.accepted, manager.id
        )

    async def test_accept_already_accepted_reverts_to_pending(self, service):
        req = _make_requirement(status=RequirementStatus.accepted)
        reverted_req = _make_requirement(status=RequirementStatus.pending)
        service.req_repo.get_by_id.side_effect = [req, reverted_req]

        manager = _make_user(role=UserRole.manager)
        bg = MagicMock()
        bg.add_task = MagicMock()

        await service.update_status(1, RequirementStatus.accepted, manager, bg)

        service.req_repo.update_status.assert_called_once_with(
            req, RequirementStatus.pending, None
        )

    async def test_decline_pending_sets_declined(self, service):
        req = _make_requirement(status=RequirementStatus.pending)
        declined_req = _make_requirement(status=RequirementStatus.declined)
        service.req_repo.get_by_id.side_effect = [req, declined_req]

        manager = _make_user(role=UserRole.manager)
        bg = MagicMock()
        bg.add_task = MagicMock()

        await service.update_status(1, RequirementStatus.declined, manager, bg)

        service.req_repo.update_status.assert_called_once_with(
            req, RequirementStatus.declined, manager.id
        )

    async def test_decline_already_declined_reverts_to_pending(self, service):
        req = _make_requirement(status=RequirementStatus.declined)
        reverted_req = _make_requirement(status=RequirementStatus.pending)
        service.req_repo.get_by_id.side_effect = [req, reverted_req]

        manager = _make_user(role=UserRole.manager)
        bg = MagicMock()
        bg.add_task = MagicMock()

        await service.update_status(1, RequirementStatus.declined, manager, bg)

        service.req_repo.update_status.assert_called_once_with(
            req, RequirementStatus.pending, None
        )

    async def test_missing_requirement_raises_404(self, service):
        service.req_repo.get_by_id.return_value = None

        manager = _make_user(role=UserRole.manager)
        bg = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            await service.update_status(999, RequirementStatus.accepted, manager, bg)
        assert exc_info.value.status_code == 404
