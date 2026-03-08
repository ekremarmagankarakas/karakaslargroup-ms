"""Unit tests for app.core.security — pure functions, no DB."""
import pytest
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("secret")
        assert hashed != "secret"

    def test_verify_correct_password(self):
        hashed = hash_password("correct")
        assert verify_password("correct", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_hashes_are_unique(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # bcrypt uses random salt


class TestTokenCreation:
    def test_access_token_round_trip(self):
        token = create_access_token(user_id=42, role="manager")
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "manager"
        assert payload["type"] == "access"

    def test_refresh_token_round_trip(self):
        token = create_refresh_token(user_id=7)
        payload = decode_token(token)
        assert payload["sub"] == "7"
        assert payload["type"] == "refresh"

    def test_access_token_has_no_role_field_mismatch(self):
        token = create_access_token(user_id=1, role="employee")
        payload = decode_token(token)
        assert payload["role"] == "employee"


class TestDecodeToken:
    def test_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_token("not.a.valid.token")
        assert exc_info.value.status_code == 401

    def test_tampered_token_raises_401(self):
        token = create_access_token(user_id=1, role="admin")
        tampered = token[:-4] + "XXXX"
        with pytest.raises(HTTPException) as exc_info:
            decode_token(tampered)
        assert exc_info.value.status_code == 401
