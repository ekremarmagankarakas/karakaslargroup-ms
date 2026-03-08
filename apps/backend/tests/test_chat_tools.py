"""Unit tests for chat tool helper functions."""
import pytest

from app.chat.tools import _safe_int, _safe_int_opt


class TestSafeInt:
    def test_returns_default_when_key_absent(self):
        assert _safe_int({}, "month", default=8, min_val=1, max_val=12) == 8

    def test_clamps_to_min(self):
        assert _safe_int({"month": 0}, "month", default=1, min_val=1, max_val=12) == 1

    def test_clamps_to_max(self):
        assert _safe_int({"month": 99}, "month", default=1, min_val=1, max_val=12) == 12

    def test_normal_value_passthrough(self):
        assert _safe_int({"month": 6}, "month", default=1, min_val=1, max_val=12) == 6

    def test_invalid_type_returns_default(self):
        assert _safe_int({"month": "abc"}, "month", default=3, min_val=1, max_val=12) == 3

    def test_none_value_returns_default(self):
        assert _safe_int({"month": None}, "month", default=5, min_val=1, max_val=12) == 5


class TestSafeIntOpt:
    def test_absent_key_returns_none(self):
        assert _safe_int_opt({}, "month", 1, 12) is None

    def test_none_value_returns_none(self):
        # Claude may pass explicit null
        assert _safe_int_opt({"month": None}, "month", 1, 12) is None

    def test_valid_value_returned(self):
        assert _safe_int_opt({"month": 3}, "month", 1, 12) == 3

    def test_clamps_below_min(self):
        assert _safe_int_opt({"month": -5}, "month", 1, 12) == 1

    def test_clamps_above_max(self):
        assert _safe_int_opt({"month": 100}, "month", 1, 12) == 12

    def test_invalid_string_returns_none(self):
        assert _safe_int_opt({"month": "bad"}, "month", 1, 12) is None

    def test_year_absent_returns_none(self):
        # Critical: this was the January-filter bug — absent year must be None
        assert _safe_int_opt({}, "year", 2020, 2100) is None

    def test_year_present_returns_value(self):
        assert _safe_int_opt({"year": 2026}, "year", 2020, 2100) == 2026
