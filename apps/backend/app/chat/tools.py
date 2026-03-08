"""
Tool definitions and handlers for the chat assistant.

Claude sees only the TOOL_DEFINITIONS (names, descriptions, input schemas).
Handlers call existing repository methods — Claude never touches SQL or the DB directly.
Role-based access is enforced inside each handler, same as the REST endpoints.
"""

import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.repositories.requirement_repository import RequirementRepository

TOOL_DEFINITIONS: list[dict] = [
    {
        "name": "get_statistics",
        "description": (
            "Get aggregate statistics: total count, pending/accepted/declined counts and prices. "
            "Use this to answer summary questions like 'how many requests do I have', "
            "'what is the total spend', or 'how many are pending'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "paid": {"type": "boolean", "description": "Filter by payment status"},
                "month": {"type": "integer", "minimum": 1, "maximum": 12, "description": "Month number 1–12"},
                "year": {"type": "integer", "minimum": 2020, "maximum": 2100, "description": "Four-digit year e.g. 2026"},
            },
        },
    },
    {
        "name": "get_requirements",
        "description": (
            "List purchase requests. Use this to answer questions about specific requests, "
            "recent activity, or to search for an item. Employees only see their own requests."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["pending", "accepted", "declined"],
                    "description": "Filter by status",
                },
                "paid": {"type": "boolean", "description": "Filter by payment status"},
                "search": {"type": "string", "maxLength": 200, "description": "Search in item name or explanation"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 20, "description": "Max results to return, default 8"},
            },
        },
    },
    {
        "name": "get_top_requesters",
        "description": (
            "Get the top users ranked by total spend. Only available for manager, admin, and accountant roles."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 20, "description": "Number of results, default 5"},
                "paid": {"type": "boolean"},
                "month": {"type": "integer", "minimum": 1, "maximum": 12},
                "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
            },
        },
    },
    {
        "name": "get_spend_over_time",
        "description": (
            "Get monthly spend data showing spending trends. "
            "Returns last 12 months by default, or all months for a specific year."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "paid": {"type": "boolean"},
                "month": {"type": "integer", "minimum": 1, "maximum": 12},
                "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
            },
        },
    },
]


def _safe_int(inputs: dict, key: str, default: int, min_val: int, max_val: int) -> int:
    """Parse and clamp a required integer input."""
    try:
        return max(min_val, min(max_val, int(inputs.get(key, default))))
    except (TypeError, ValueError):
        return default


def _safe_int_opt(inputs: dict, key: str, min_val: int, max_val: int) -> int | None:
    """Parse and clamp an optional integer input. Returns None when the key is absent."""
    val = inputs.get(key)
    if val is None:
        return None
    try:
        return max(min_val, min(max_val, int(val)))
    except (TypeError, ValueError):
        return None


async def run_tool(
    name: str,
    inputs: dict[str, Any],
    db: AsyncSession,
    current_user: User,
) -> str:
    """Dispatch a tool call and return a JSON string result."""
    repo = RequirementRepository(db)

    if name == "get_statistics":
        month = _safe_int_opt(inputs, "month", 1, 12)
        year = _safe_int_opt(inputs, "year", 2020, 2100)
        data = await repo.get_statistics(
            user_id=current_user.id,
            role=current_user.role,
            paid=inputs.get("paid"),
            month=month,
            year=year,
        )
        return json.dumps({k: str(v) for k, v in data.items()})

    if name == "get_requirements":
        from app.models.requirement import RequirementStatus

        status_val = inputs.get("status")
        status = RequirementStatus(status_val) if status_val in ("pending", "accepted", "declined") else None
        limit = _safe_int(inputs, "limit", 8, 1, 20)
        search_raw = inputs.get("search")
        search = str(search_raw)[:200] if search_raw else None

        items, total = await repo.get_paginated(
            user_id=current_user.id,
            role=current_user.role,
            page=1,
            limit=limit,
            search=search,
            status=status,
            paid=inputs.get("paid"),
        )
        return json.dumps(
            {
                "total": total,
                "items": [
                    {
                        "id": r.id,
                        "item_name": r.item_name,
                        "price": str(r.price),
                        "status": r.status.value,
                        "paid": r.paid,
                        "username": r.user.username if r.user else None,
                        "created_at": r.created_at.isoformat(),
                    }
                    for r in items
                ],
            }
        )

    if name == "get_top_requesters":
        if current_user.role == UserRole.employee:
            return json.dumps({"error": "Bu araç çalışan rolü için kullanılamaz."})
        rows = await repo.get_top_requesters(
            limit=_safe_int(inputs, "limit", 5, 1, 20),
            paid=inputs.get("paid"),
            month=_safe_int_opt(inputs, "month", 1, 12),
            year=_safe_int_opt(inputs, "year", 2020, 2100),
        )
        return json.dumps(
            [
                {
                    "username": r["username"],
                    "total_price": str(r["total_price"]),
                    "total_count": r["total_count"],
                    "accepted_count": r["accepted_count"],
                }
                for r in rows
            ]
        )

    if name == "get_spend_over_time":
        from app.api.routes.statistics import TURKISH_MONTHS, _fill_and_label_months

        month = _safe_int_opt(inputs, "month", 1, 12)
        year = _safe_int_opt(inputs, "year", 2020, 2100)
        rows = await repo.get_spend_over_time(
            user_id=current_user.id,
            role=current_user.role,
            paid=inputs.get("paid"),
            month=month,
            year=year,
        )
        points = _fill_and_label_months(rows, year=year, month=month)
        return json.dumps(
            [
                {
                    "label": p.month_label,
                    "total_price": str(p.total_price),
                    "accepted_price": str(p.accepted_price),
                    "count": p.count,
                }
                for p in points
            ]
        )

    return json.dumps({"error": f"Unknown tool: {name}"})
