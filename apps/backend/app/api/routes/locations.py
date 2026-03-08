from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminOnly, CurrentUser, get_db
from app.repositories.location_repository import LocationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.location import (
    LocationCreate,
    LocationUpdate,
    LocationWithUsersResponse,
    UserLocationAssign,
)
from app.schemas.user import UserDropdownItem

router = APIRouter()


def _repo(db: AsyncSession) -> LocationRepository:
    return LocationRepository(db)


@router.get("/", response_model=list[LocationWithUsersResponse])
async def list_locations(
    _: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    locations = await _repo(db).get_all()
    return [
        LocationWithUsersResponse(
            id=loc.id,
            name=loc.name,
            address=loc.address,
            created_at=loc.created_at,
            users=[UserDropdownItem(id=u.id, username=u.username) for u in loc.users],
        )
        for loc in locations
    ]


@router.post("/", response_model=LocationWithUsersResponse, status_code=201)
async def create_location(
    body: LocationCreate,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = _repo(db)
    existing = await repo.get_by_name(body.name)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Location name already exists")
    loc = await repo.create(body.name, body.address)
    return LocationWithUsersResponse(
        id=loc.id, name=loc.name, address=loc.address, created_at=loc.created_at, users=[]
    )


@router.patch("/{location_id}", response_model=LocationWithUsersResponse)
async def update_location(
    location_id: int,
    body: LocationUpdate,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = _repo(db)
    loc = await repo.get_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    loc = await repo.update(loc, body.name, body.address)
    return LocationWithUsersResponse(
        id=loc.id,
        name=loc.name,
        address=loc.address,
        created_at=loc.created_at,
        users=[UserDropdownItem(id=u.id, username=u.username) for u in loc.users],
    )


@router.delete("/{location_id}", status_code=204)
async def delete_location(
    location_id: int,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = _repo(db)
    loc = await repo.get_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    await repo.delete(loc)


@router.get("/{location_id}/users", response_model=list[UserDropdownItem])
async def list_location_users(
    location_id: int,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = _repo(db)
    loc = await repo.get_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    users = await repo.get_users_for_location(location_id)
    return [UserDropdownItem(id=u.id, username=u.username) for u in users]


@router.post("/{location_id}/users", status_code=204)
async def assign_user_to_location(
    location_id: int,
    body: UserLocationAssign,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = _repo(db)
    loc = await repo.get_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    user = await UserRepository(db).get_by_id(body.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await repo.assign_user(body.user_id, location_id)


@router.delete("/{location_id}/users/{user_id}", status_code=204)
async def remove_user_from_location(
    location_id: int,
    user_id: int,
    _: AdminOnly,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _repo(db).remove_user(user_id, location_id)
