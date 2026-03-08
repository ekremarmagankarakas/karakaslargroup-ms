"""Tests for Feature 6: In-App Notification Bell."""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.repositories.notification_repository import NotificationRepository


def _make_notification(notif_id=1, user_id=1, read=False, message="Test notification"):
    notif = MagicMock()
    notif.id = notif_id
    notif.user_id = user_id
    notif.requirement_id = 1
    notif.message = message
    notif.read = read
    notif.created_at = MagicMock()
    return notif


class TestNotificationRepository:
    async def test_create_notification(self):
        mock_db = AsyncMock()
        repo = NotificationRepository(mock_db)
        notif = _make_notification()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda obj: None)

        # Simulate refresh setting an id
        async def _refresh(obj):
            obj.id = 1
        mock_db.refresh = _refresh

        result = await repo.create(user_id=1, message="Test", requirement_id=10)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    async def test_get_for_user_returns_list(self):
        mock_db = AsyncMock()
        repo = NotificationRepository(mock_db)
        notifs = [_make_notification(1), _make_notification(2, read=True)]

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = notifs
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await repo.get_for_user(user_id=1)

        assert len(result) == 2

    async def test_count_unread(self):
        mock_db = AsyncMock()
        repo = NotificationRepository(mock_db)
        unread = [_make_notification(1, read=False), _make_notification(2, read=False)]

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = unread
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute = AsyncMock(return_value=mock_result)

        count = await repo.count_unread(user_id=1)

        assert count == 2

    async def test_mark_all_read(self):
        mock_db = AsyncMock()
        repo = NotificationRepository(mock_db)
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()

        await repo.mark_all_read(user_id=1)

        mock_db.commit.assert_called_once()


class TestNotificationApiGuards:
    async def test_employee_can_list_notifications(self, employee_client):
        resp = await employee_client.get("/api/notifications/")
        assert resp.status_code != 403

    async def test_manager_can_list_notifications(self, manager_client):
        resp = await manager_client.get("/api/notifications/")
        assert resp.status_code != 403

    async def test_employee_can_get_unread_count(self, employee_client):
        resp = await employee_client.get("/api/notifications/unread-count")
        assert resp.status_code != 403

    async def test_employee_can_mark_all_read(self, employee_client):
        resp = await employee_client.patch("/api/notifications/read-all")
        assert resp.status_code != 403

    async def test_unauthenticated_cannot_list_notifications(self, anon_client):
        resp = await anon_client.get("/api/notifications/")
        assert resp.status_code in (401, 403)

    async def test_unauthenticated_cannot_mark_read(self, anon_client):
        resp = await anon_client.patch("/api/notifications/read-all")
        assert resp.status_code in (401, 403)


class TestNotificationGeneration:
    """Test that notifications are created during requirement lifecycle."""

    async def test_update_status_creates_notification_for_owner(self):
        from datetime import datetime, timezone
        from decimal import Decimal
        from app.models.requirement import Requirement, RequirementStatus
        from app.models.user import User, UserRole
        from app.services.requirement_service import RequirementService

        notif_repo = AsyncMock()
        req_repo = AsyncMock()
        fav_repo = AsyncMock()
        fav_repo.get_favorited_ids_for_user.return_value = set()
        user_repo = AsyncMock()
        storage = MagicMock()
        storage.get_presigned_url.return_value = ""

        owner = MagicMock(spec=User)
        owner.id = 10
        owner.username = "owner"
        owner.email = "owner@example.com"
        user_repo.get_by_id.return_value = owner
        user_repo.get_emails_by_roles.return_value = []

        req = MagicMock(spec=Requirement)
        req.id = 1
        req.user_id = 10
        req.item_name = "Test"
        req.price = Decimal("100")
        req.explanation = None
        req.status = RequirementStatus.pending
        req.paid = False
        req.approved_by = None
        req.images = []
        req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        req.user = MagicMock()
        req.user.username = "owner"
        req.approver = None
        req.location = None

        accepted_req = MagicMock(spec=Requirement)
        accepted_req.id = 1
        accepted_req.user_id = 10
        accepted_req.item_name = "Test"
        accepted_req.price = Decimal("100")
        accepted_req.explanation = None
        accepted_req.status = RequirementStatus.accepted
        accepted_req.paid = False
        accepted_req.approved_by = 2
        accepted_req.images = []
        accepted_req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        accepted_req.user = MagicMock()
        accepted_req.user.username = "owner"
        accepted_req.approver = MagicMock()
        accepted_req.approver.username = "manager"
        accepted_req.location = None

        req_repo.get_by_id.side_effect = [req, accepted_req]

        svc = RequirementService(
            req_repo=req_repo,
            img_repo=AsyncMock(),
            fav_repo=fav_repo,
            user_repo=user_repo,
            storage=storage,
            email=AsyncMock(),
            notif_repo=notif_repo,
        )

        manager = MagicMock(spec=User)
        manager.id = 2
        manager.role = UserRole.manager
        bg = MagicMock()
        bg.add_task = MagicMock()

        await svc.update_status(1, RequirementStatus.accepted, manager, bg)

        notif_repo.create.assert_called_once()
        call_kwargs = notif_repo.create.call_args
        # owner should be notified
        assert call_kwargs[1]["user_id"] == 10 or call_kwargs[0][0] == 10
