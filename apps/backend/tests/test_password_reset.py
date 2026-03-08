"""Tests for Feature 9: Password Reset via Email."""
import hashlib
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from app.repositories.password_reset_repository import PasswordResetRepository
from app.services.auth_service import AuthService


def _make_token(token_hash="abc123", user_id=1, used=False, expires_delta=timedelta(hours=1)):
    token = MagicMock()
    token.id = 1
    token.user_id = user_id
    token.token_hash = token_hash
    token.used = used
    token.expires_at = datetime.now(timezone.utc) + expires_delta
    return token


class TestPasswordResetRepository:
    async def test_create_stores_token(self):
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        async def _refresh(obj):
            obj.id = 1

        mock_db.refresh = _refresh
        repo = PasswordResetRepository(mock_db)

        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await repo.create(user_id=1, token_hash="somehash", expires_at=expires)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    async def test_get_by_hash_returns_token(self):
        mock_db = AsyncMock()
        token = _make_token()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = token
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = PasswordResetRepository(mock_db)
        result = await repo.get_by_hash("abc123")

        assert result is token

    async def test_get_by_hash_returns_none_for_unknown(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = PasswordResetRepository(mock_db)
        result = await repo.get_by_hash("unknown")

        assert result is None

    async def test_mark_used_sets_flag(self):
        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()

        repo = PasswordResetRepository(mock_db)
        token = _make_token(used=False)
        await repo.mark_used(token)

        assert token.used is True
        mock_db.commit.assert_called_once()


class TestForgotPasswordService:
    async def test_forgot_password_sends_email_for_known_user(self):
        user_repo = AsyncMock()
        reset_repo = AsyncMock()
        email_service = AsyncMock()

        user = MagicMock()
        user.id = 1
        user.email = "user@example.com"
        user.is_active = True
        user_repo.get_by_email.return_value = user

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo, email=email_service)
        await svc.forgot_password("user@example.com")

        reset_repo.create.assert_called_once()
        email_service.send_password_reset.assert_called_once()
        # The email was sent to the user's address
        call_args = email_service.send_password_reset.call_args[0]
        assert call_args[0] == "user@example.com"

    async def test_forgot_password_does_not_reveal_unknown_email(self):
        """No exception raised for unknown email — silent no-op."""
        user_repo = AsyncMock()
        reset_repo = AsyncMock()
        email_service = AsyncMock()
        user_repo.get_by_email.return_value = None

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo, email=email_service)
        # Should not raise
        await svc.forgot_password("nobody@example.com")

        reset_repo.create.assert_not_called()
        email_service.send_password_reset.assert_not_called()

    async def test_forgot_password_skips_inactive_user(self):
        user_repo = AsyncMock()
        reset_repo = AsyncMock()
        email_service = AsyncMock()

        inactive_user = MagicMock()
        inactive_user.id = 5
        inactive_user.email = "inactive@example.com"
        inactive_user.is_active = False
        user_repo.get_by_email.return_value = inactive_user

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo, email=email_service)
        await svc.forgot_password("inactive@example.com")

        reset_repo.create.assert_not_called()

    async def test_forgot_password_no_op_without_repos(self):
        """If reset_repo/email not configured, silently returns."""
        user_repo = AsyncMock()
        svc = AuthService(user_repo=user_repo)
        await svc.forgot_password("user@example.com")  # must not raise


class TestResetPasswordService:
    async def test_reset_password_valid_token(self):
        user_repo = AsyncMock()
        reset_repo = AsyncMock()
        email_service = AsyncMock()

        raw_token = "valid_token_string"
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        token = _make_token(token_hash=token_hash, used=False)
        reset_repo.get_by_hash.return_value = token

        user = MagicMock()
        user.id = 1
        user_repo.get_by_id.return_value = user

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo, email=email_service)
        await svc.reset_password(raw_token, "new_password_123")

        user_repo.update_password.assert_called_once()
        reset_repo.mark_used.assert_called_once_with(token)

    async def test_reset_password_invalid_token_raises_400(self):
        from fastapi import HTTPException

        user_repo = AsyncMock()
        reset_repo = AsyncMock()
        reset_repo.get_by_hash.return_value = None

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo)
        with pytest.raises(HTTPException) as exc_info:
            await svc.reset_password("bad_token", "newpass")
        assert exc_info.value.status_code == 400

    async def test_reset_password_used_token_raises_400(self):
        from fastapi import HTTPException

        user_repo = AsyncMock()
        reset_repo = AsyncMock()

        raw_token = "already_used"
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        token = _make_token(token_hash=token_hash, used=True)
        reset_repo.get_by_hash.return_value = token

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo)
        with pytest.raises(HTTPException) as exc_info:
            await svc.reset_password(raw_token, "newpass")
        assert exc_info.value.status_code == 400

    async def test_reset_password_expired_token_raises_400(self):
        from fastapi import HTTPException

        user_repo = AsyncMock()
        reset_repo = AsyncMock()

        raw_token = "expired_token"
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        # Expired 2 hours ago
        token = _make_token(token_hash=token_hash, used=False, expires_delta=timedelta(hours=-2))
        reset_repo.get_by_hash.return_value = token

        svc = AuthService(user_repo=user_repo, reset_repo=reset_repo)
        with pytest.raises(HTTPException) as exc_info:
            await svc.reset_password(raw_token, "newpass")
        assert exc_info.value.status_code == 400

    async def test_reset_password_no_repo_raises_400(self):
        from fastapi import HTTPException

        user_repo = AsyncMock()
        svc = AuthService(user_repo=user_repo)
        with pytest.raises(HTTPException) as exc_info:
            await svc.reset_password("token", "newpass")
        assert exc_info.value.status_code == 400


class TestPasswordResetApiEndpoints:
    async def test_forgot_password_endpoint_accepts_email(self, no_auth_client):
        resp = await no_auth_client.post(
            "/api/auth/forgot-password", json={"email": "user@example.com"}
        )
        # Should not 422; forgot_password silently no-ops for unknown users → 204
        assert resp.status_code != 422

    async def test_forgot_password_requires_valid_email(self, no_auth_client):
        resp = await no_auth_client.post(
            "/api/auth/forgot-password", json={"email": "not_an_email"}
        )
        assert resp.status_code == 422

    async def test_reset_password_endpoint_requires_token_and_password(self, no_auth_client):
        resp = await no_auth_client.post("/api/auth/reset-password", json={})
        assert resp.status_code == 422

    async def test_reset_password_endpoint_accepts_valid_body(self, no_auth_client):
        resp = await no_auth_client.post(
            "/api/auth/reset-password",
            json={"token": "sometoken", "new_password": "NewPass123"},
        )
        # Not 422; may 400 (invalid token from mock) but schema is valid
        assert resp.status_code != 422
