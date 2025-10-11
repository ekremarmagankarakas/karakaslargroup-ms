from fastapi import APIRouter
router = APIRouter(prefix="/api/core", tags=["core"])

@router.get("/health")
def health():
    return {"status": "healthy"}

