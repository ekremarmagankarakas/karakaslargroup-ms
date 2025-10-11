from fastapi import APIRouter
router = APIRouter(prefix="/api/manage", tags=["manage"])

@router.get("/sites/hello")
def hello_manage():
    return {"ok": True, "area": "manage", "message": "Manage API up"}

