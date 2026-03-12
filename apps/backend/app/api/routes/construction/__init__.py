from fastapi import APIRouter

from app.api.routes.construction import materials, milestones, projects

router = APIRouter()
router.include_router(projects.router)
router.include_router(materials.router)
router.include_router(milestones.router)
