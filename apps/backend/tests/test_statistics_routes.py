"""Unit tests for _fill_and_label_months in statistics routes."""
from datetime import date
from decimal import Decimal
from unittest.mock import patch

import pytest

from app.api.routes.statistics import TURKISH_MONTHS, _fill_and_label_months


def _row(year: int, month: int, total: int = 100, accepted: int = 50, count: int = 2) -> dict:
    return {
        "year": year,
        "month": month,
        "total_price": Decimal(total),
        "accepted_price": Decimal(accepted),
        "count": count,
    }


class TestFillAndLabelMonths:
    def test_returns_12_months_when_no_filter(self):
        with patch("app.api.routes.statistics.date") as mock_date:
            mock_date.today.return_value = date(2026, 3, 8)
            result = _fill_and_label_months([], year=None, month=None)
        assert len(result) == 12

    def test_returns_single_month_when_year_and_month(self):
        result = _fill_and_label_months([], year=2026, month=3)
        assert len(result) == 1
        assert result[0].month == 3
        assert result[0].year == 2026

    def test_returns_12_months_for_full_year(self):
        result = _fill_and_label_months([], year=2025, month=None)
        assert len(result) == 12
        for i, point in enumerate(result):
            assert point.month == i + 1
            assert point.year == 2025

    def test_fills_missing_months_with_zeros(self):
        with patch("app.api.routes.statistics.date") as mock_date:
            mock_date.today.return_value = date(2026, 3, 8)
            result = _fill_and_label_months([], year=None, month=None)
        for point in result:
            assert point.total_price == 0
            assert point.accepted_price == 0
            assert point.count == 0

    def test_existing_row_data_is_used(self):
        rows = [_row(2026, 3, total=500, accepted=200, count=5)]
        result = _fill_and_label_months(rows, year=2026, month=3)
        assert result[0].total_price == Decimal(500)
        assert result[0].accepted_price == Decimal(200)
        assert result[0].count == 5

    def test_labels_include_year_in_rolling_mode(self):
        with patch("app.api.routes.statistics.date") as mock_date:
            mock_date.today.return_value = date(2026, 3, 8)
            result = _fill_and_label_months([], year=None, month=None)
        # All labels should contain the year
        for point in result:
            assert str(point.year) in point.month_label

    def test_label_is_turkish_month_only_for_single_month(self):
        result = _fill_and_label_months([], year=2026, month=3)
        assert result[0].month_label == TURKISH_MONTHS[2]  # "Mar"
        assert "2026" not in result[0].month_label

    def test_rolling_12_months_cross_year_boundary(self):
        # When today is March 2026, month 12 months ago is April 2025
        with patch("app.api.routes.statistics.date") as mock_date:
            mock_date.today.return_value = date(2026, 3, 8)
            result = _fill_and_label_months([], year=None, month=None)
        years = [p.year for p in result]
        assert 2025 in years  # spans into previous year
        assert 2026 in years

    def test_turkish_months_list_has_12_entries(self):
        assert len(TURKISH_MONTHS) == 12

    def test_march_label_is_mar(self):
        assert TURKISH_MONTHS[2] == "Mar"

    def test_january_label_is_oca(self):
        assert TURKISH_MONTHS[0] == "Oca"
