from fastapi import APIRouter

from app.api.routes.construction import (
    analytics,
    comments,
    daily_logs,
    issues,
    materials,
    milestones,
    photos,
    projects,
    subcontractors,
)

router = APIRouter()
router.include_router(analytics.router)
router.include_router(projects.router)
router.include_router(materials.router)
router.include_router(milestones.router)
router.include_router(issues.router)
router.include_router(photos.router)
router.include_router(comments.router)
router.include_router(daily_logs.router)
router.include_router(subcontractors.router)
