from fastapi import APIRouter
router = APIRouter(prefix="/api/build", tags=["build"])

@router.get("/projects/hello")
def hello_build():
    return {"ok": True, "area": "build", "message": "Build API up"}

