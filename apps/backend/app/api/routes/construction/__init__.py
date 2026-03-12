from fastapi import APIRouter

from app.api.routes.construction import analytics, issues, materials, milestones, projects

router = APIRouter()
router.include_router(analytics.router)
router.include_router(projects.router)
router.include_router(materials.router)
router.include_router(milestones.router)
router.include_router(issues.router)
