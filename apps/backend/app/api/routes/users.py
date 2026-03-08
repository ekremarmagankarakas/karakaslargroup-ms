from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, ManagerOrAdmin, ManagerOrAccountantOrAdmin, get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordChangeRequest, UserCreate, UserDropdownItem, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/", response_model=list[UserDropdownItem])
async def list_users(
    _: ManagerOrAccountantOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = UserRepository(db)
    users = await repo.get_all()
    return users


@router.get("/all", response_model=list[UserResponse])
async def list_all_users(
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = UserRepository(db)
    users = await repo.get_all(active_only=False)
    return [UserResponse.model_validate(u) for u in users]


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    _: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = UserService(UserRepository(db))
    return await service.create_user(body)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: UserUpdate,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updated = await repo.update_user(user, body.role, body.email, body.is_active)
    return UserResponse.model_validate(updated)


@router.patch("/me/password", status_code=204)
async def change_password(
    body: PasswordChangeRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = UserService(UserRepository(db))
    await service.change_password(current_user, body.current_password, body.new_password)
