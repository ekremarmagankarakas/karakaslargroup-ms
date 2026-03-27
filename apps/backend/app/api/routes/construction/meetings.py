from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, CurrentUser, ManagerOrAdmin
from app.repositories.construction.meeting_repository import MeetingRepository
from app.schemas.construction.meeting import MeetingCreate, MeetingResponse, MeetingUpdate, ActionResponse
from app.services.construction.meeting_service import MeetingService

router = APIRouter()


def _get_service(db: AsyncSession) -> MeetingService:
    return MeetingService(repo=MeetingRepository(db))


@router.get("/{project_id}/meetings", response_model=list[MeetingResponse])
async def list_meetings(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_meetings(project_id)


@router.post("/{project_id}/meetings", response_model=MeetingResponse)
async def create_meeting(
    project_id: int,
    body: MeetingCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_meeting(project_id, body, current_user.id)


@router.patch("/{project_id}/meetings/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    project_id: int,
    meeting_id: int,
    body: MeetingUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_meeting(project_id, meeting_id, body)


@router.delete("/{project_id}/meetings/{meeting_id}", status_code=204)
async def delete_meeting(
    project_id: int,
    meeting_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_meeting(project_id, meeting_id)


@router.post("/{project_id}/meetings/{meeting_id}/actions/{action_id}/toggle", response_model=ActionResponse)
async def toggle_action(
    project_id: int,
    meeting_id: int,
    action_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).toggle_action(project_id, meeting_id, action_id)
