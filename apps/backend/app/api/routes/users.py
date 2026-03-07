from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, ManagerOrAccountantOrAdmin, get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordChangeRequest, UserCreate, UserDropdownItem, UserResponse
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


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    _: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = UserService(UserRepository(db))
    return await service.create_user(body)


@router.patch("/me/password", status_code=204)
async def change_password(
    body: PasswordChangeRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = UserService(UserRepository(db))
    await service.change_password(current_user, body.current_password, body.new_password)
