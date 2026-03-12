from fastapi import APIRouter

from app.api.routes.construction import (
    analytics,
    budget,
    change_orders,
    invoices,
    punch_list,
    safety,
    chat,
    comments,
    daily_logs,
    documents,
    favorites,
    issues,
    materials,
    milestones,
    notifications as construction_notifications,
    permits,
    photos,
    projects,
    shipments,
    subcontractors,
    team,
)

router = APIRouter()
router.include_router(analytics.router)
router.include_router(chat.router)
router.include_router(construction_notifications.router)
router.include_router(favorites.router)
router.include_router(shipments.router)  # must be before projects (has /shipments/pending static path)
router.include_router(team.router)  # must be before projects (has /my-projects static path)
router.include_router(projects.router)
router.include_router(materials.router)
router.include_router(milestones.router)
router.include_router(issues.router)
router.include_router(photos.router)
router.include_router(comments.router)
router.include_router(daily_logs.router)
router.include_router(subcontractors.router)
router.include_router(permits.router)
router.include_router(change_orders.router)
router.include_router(documents.router)
router.include_router(budget.router)
router.include_router(safety.router)
router.include_router(invoices.router)  # /invoices/overdue must be before /{project_id}
router.include_router(punch_list.router)
