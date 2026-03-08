"""Tests for Feature 7: Audit Log / Change History."""
import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from app.repositories.audit_log_repository import AuditLogRepository
from app.models.audit_log import AuditAction


def _make_log(log_id=1, requirement_id=1, actor_id=2, action=AuditAction.status_changed):
    log = MagicMock()
    log.id = log_id
    log.requirement_id = requirement_id
    log.actor_id = actor_id
    log.action = action
    log.old_value = "pending"
    log.new_value = "accepted"
    log.created_at = MagicMock()
    log.actor = MagicMock()
    log.actor.username = "manager"
    return log


class TestAuditLogRepository:
    async def test_create_writes_to_db(self):
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        async def _refresh(obj):
            obj.id = 1

        mock_db.refresh = _refresh
        repo = AuditLogRepository(mock_db)

        await repo.create(
            requirement_id=1,
            actor_id=2,
            action=AuditAction.status_changed,
            old_value="pending",
            new_value="accepted",
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    async def test_get_for_requirement_returns_list(self):
        mock_db = AsyncMock()
        logs = [_make_log(1), _make_log(2, action=AuditAction.edited)]

        mock_scalars = MagicMock()
        mock_scalars.unique.return_value = mock_scalars
        mock_scalars.all.return_value = logs
        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = AuditLogRepository(mock_db)
        result = await repo.get_for_requirement(requirement_id=1)

        assert len(result) == 2

    async def test_create_without_old_new_values(self):
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        async def _refresh(obj):
            obj.id = 5

        mock_db.refresh = _refresh
        repo = AuditLogRepository(mock_db)

        await repo.create(requirement_id=3, actor_id=1, action=AuditAction.created)

        mock_db.add.assert_called_once()


class TestAuditLogApiGuards:
    async def test_manager_can_view_audit(self, manager_client):
        resp = await manager_client.get("/api/requirements/1/audit")
        assert resp.status_code != 403

    async def test_admin_can_view_audit(self, admin_client):
        resp = await admin_client.get("/api/requirements/1/audit")
        assert resp.status_code != 403

    async def test_employee_cannot_view_audit(self, employee_client):
        resp = await employee_client.get("/api/requirements/1/audit")
        assert resp.status_code == 403

    async def test_accountant_cannot_view_audit(self, accountant_client):
        resp = await accountant_client.get("/api/requirements/1/audit")
        assert resp.status_code == 403

    async def test_unauthenticated_cannot_view_audit(self, anon_client):
        resp = await anon_client.get("/api/requirements/1/audit")
        assert resp.status_code in (401, 403)


class TestAuditLogGeneration:
    """Test that audit logs are written during requirement lifecycle."""

    async def test_create_requirement_writes_audit_log(self):
        from app.models.requirement import Requirement, RequirementStatus
        from app.models.user import User, UserRole
        from app.services.requirement_service import RequirementService

        req_repo = AsyncMock()
        img_repo = AsyncMock()
        fav_repo = AsyncMock()
        fav_repo.get_favorited_ids_for_user.return_value = set()
        user_repo = AsyncMock()
        user_repo.get_by_id.return_value = MagicMock(spec=User, id=1)
        user_repo.get_emails_by_roles.return_value = []
        storage = MagicMock()
        storage.get_presigned_url.return_value = ""
        notif_repo = AsyncMock()
        audit_repo = AsyncMock()

        created_req = MagicMock(spec=Requirement)
        created_req.id = 42
        created_req.user_id = 1
        created_req.item_name = "Laptop"
        created_req.price = Decimal("1000")
        created_req.explanation = None
        created_req.status = RequirementStatus.pending
        created_req.paid = False
        created_req.approved_by = None
        created_req.images = []
        created_req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        created_req.user = MagicMock()
        created_req.user.username = "employee"
        created_req.approver = None
        req_repo.create.return_value = created_req
        req_repo.get_by_id.return_value = created_req
        user_repo.get_users_by_roles = AsyncMock(return_value=[])

        svc = RequirementService(
            req_repo=req_repo,
            img_repo=img_repo,
            fav_repo=fav_repo,
            user_repo=user_repo,
            storage=storage,
            email=AsyncMock(),
            notif_repo=notif_repo,
            audit_repo=audit_repo,
        )

        owner = MagicMock(spec=User)
        owner.id = 1
        owner.role = UserRole.employee
        owner.username = "employee"
        bg = MagicMock()
        bg.add_task = MagicMock()

        await svc.create_requirement(owner, "Laptop", Decimal("1000"), None, bg)

        audit_repo.create.assert_called_once()
        call_args = audit_repo.create.call_args
        # action is either positional (index 2) or keyword
        action = call_args[1].get("action") or call_args[0][2]
        assert action == AuditAction.created

    async def test_update_status_writes_audit_log(self):
        from app.models.requirement import Requirement, RequirementStatus
        from app.models.user import User, UserRole
        from app.services.requirement_service import RequirementService

        req_repo = AsyncMock()
        fav_repo = AsyncMock()
        fav_repo.get_favorited_ids_for_user.return_value = set()
        user_repo = AsyncMock()
        storage = MagicMock()
        storage.get_presigned_url.return_value = ""
        notif_repo = AsyncMock()
        audit_repo = AsyncMock()

        owner = MagicMock(spec=User)
        owner.id = 10
        owner.username = "owner"
        owner.email = "owner@example.com"
        user_repo.get_by_id.return_value = owner
        user_repo.get_emails_by_roles.return_value = []

        req = MagicMock(spec=Requirement)
        req.id = 1
        req.user_id = 10
        req.item_name = "Item"
        req.price = Decimal("50")
        req.explanation = None
        req.status = RequirementStatus.pending
        req.paid = False
        req.approved_by = None
        req.images = []
        req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        req.user = MagicMock()
        req.user.username = "owner"
        req.approver = None

        updated_req = MagicMock(spec=Requirement)
        updated_req.id = 1
        updated_req.user_id = 10
        updated_req.item_name = "Item"
        updated_req.price = Decimal("50")
        updated_req.explanation = None
        updated_req.status = RequirementStatus.accepted
        updated_req.paid = False
        updated_req.approved_by = 2
        updated_req.images = []
        updated_req.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        updated_req.user = MagicMock()
        updated_req.user.username = "owner"
        updated_req.approver = MagicMock()
        updated_req.approver.username = "manager"
        req_repo.get_by_id.side_effect = [req, updated_req]

        svc = RequirementService(
            req_repo=req_repo,
            img_repo=AsyncMock(),
            fav_repo=fav_repo,
            user_repo=user_repo,
            storage=storage,
            email=AsyncMock(),
            notif_repo=notif_repo,
            audit_repo=audit_repo,
        )

        manager = MagicMock(spec=User)
        manager.id = 2
        manager.role = UserRole.manager
        bg = MagicMock()
        bg.add_task = MagicMock()

        await svc.update_status(1, RequirementStatus.accepted, manager, bg)

        audit_repo.create.assert_called_once()
        call_args = audit_repo.create.call_args
        action = call_args[1].get("action") or call_args[0][2]
        assert action == AuditAction.status_changed
