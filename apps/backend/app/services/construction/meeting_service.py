from app.models.construction.meeting import ConstructionMeeting
from app.repositories.construction.meeting_repository import MeetingRepository
from app.schemas.construction.meeting import MeetingCreate, MeetingResponse, MeetingUpdate, ActionResponse
from fastapi import HTTPException


class MeetingService:
    def __init__(self, repo: MeetingRepository) -> None:
        self.repo = repo

    async def list_meetings(self, project_id: int) -> list[MeetingResponse]:
        meetings = await self.repo.get_by_project(project_id)
        return [MeetingResponse.model_validate(m) for m in meetings]

    async def get_meeting(self, project_id: int, meeting_id: int) -> MeetingResponse:
        meeting = await self.repo.get_by_id(meeting_id)
        if not meeting or meeting.project_id != project_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return MeetingResponse.model_validate(meeting)

    async def create_meeting(self, project_id: int, body: MeetingCreate, created_by: int) -> MeetingResponse:
        data = body.model_dump(exclude={"actions"})
        data["project_id"] = project_id
        data["created_by"] = created_by
        actions = [a.model_dump() for a in body.actions]
        meeting = await self.repo.create(data, actions)
        return MeetingResponse.model_validate(meeting)

    async def update_meeting(self, project_id: int, meeting_id: int, body: MeetingUpdate) -> MeetingResponse:
        meeting = await self.repo.get_by_id(meeting_id)
        if not meeting or meeting.project_id != project_id:
            raise HTTPException(status_code=404, detail="Meeting not found")
        data = body.model_dump(exclude_none=True)
        updated = await self.repo.update(meeting, data)
        refreshed = await self.repo.get_by_id(updated.id)
        return MeetingResponse.model_validate(refreshed)

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
        return ActionResponse.model_validate(toggled)
