from app.repositories.construction.meeting_repository import MeetingRepository
from app.schemas.construction.meeting import (
    ActionResponse,
    MeetingCreate,
    MeetingResponse,
    MeetingUpdate,
)
from fastapi import HTTPException


def _action_to_response(a) -> ActionResponse:
    return ActionResponse(
        id=a.id,
        meeting_id=a.meeting_id,
        description=a.description,
        assigned_to_name=a.assigned_to_name,
        due_date=a.due_date,
        completed=a.completed,
        created_at=a.created_at,
    )


def _to_response(m) -> MeetingResponse:
    return MeetingResponse(
        id=m.id,
        project_id=m.project_id,
        title=m.title,
        meeting_date=m.meeting_date,
        location=m.location,
        attendees=m.attendees,
        agenda=m.agenda,
        summary=m.summary,
        decisions=m.decisions,
        created_by=m.created_by,
        creator_username=m.creator.username if m.creator else None,
        actions=[_action_to_response(a) for a in (m.actions or [])],
        created_at=m.created_at,
    )


class MeetingService:
    def __init__(self, repo: MeetingRepository) -> None:
        self.repo = repo

    async def list_meetings(self, project_id: int) -> list[MeetingResponse]:
        meetings = await self.repo.get_by_project(project_id)
        return [_to_response(m) for m in meetings]

    async def get_meeting(self, project_id: int, meeting_id: int) -> MeetingResponse:
        meeting = await self.repo.get_by_id(meeting_id)
        if not meeting or meeting.project_id != project_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return _to_response(meeting)

    async def create_meeting(self, project_id: int, body: MeetingCreate, created_by: int) -> MeetingResponse:
        data = body.model_dump(exclude={"actions"})
        data["project_id"] = project_id
        data["created_by"] = created_by
        actions = [a.model_dump() for a in body.actions]
        meeting = await self.repo.create(data, actions)
        return _to_response(meeting)

    async def update_meeting(self, project_id: int, meeting_id: int, body: MeetingUpdate) -> MeetingResponse:
        meeting = await self.repo.get_by_id(meeting_id)
        if not meeting or meeting.project_id != project_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        data = body.model_dump(exclude_none=True)
        await self.repo.update(meeting, data)
        refreshed = await self.repo.get_by_id(meeting_id)
        return _to_response(refreshed)

    async def delete_meeting(self, project_id: int, meeting_id: int) -> None:
        meeting = await self.repo.get_by_id(meeting_id)
        if not meeting or meeting.project_id != project_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        await self.repo.delete(meeting)

    async def toggle_action(self, project_id: int, meeting_id: int, action_id: int) -> ActionResponse:
        meeting = await self.repo.get_by_id(meeting_id)
        if not meeting or meeting.project_id != project_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        action = await self.repo.get_action(action_id)
        if not action or action.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Action not found")
        toggled = await self.repo.toggle_action(action)
        return _action_to_response(toggled)
