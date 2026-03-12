from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, get_db
from app.repositories.procurement.category_repository import CategoryRepository
from app.schemas.procurement.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(_: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = CategoryRepository(db)
    return await repo.get_all()


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CategoryCreate,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = CategoryRepository(db)
    return await repo.create(name=body.name, color=body.color)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = CategoryRepository(db)
    cat = await repo.get_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return await repo.update(cat, body.name, body.color)


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = CategoryRepository(db)
    cat = await repo.get_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await repo.delete(cat)
