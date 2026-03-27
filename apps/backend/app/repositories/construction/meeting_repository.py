from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.meeting import ConstructionMeeting, ConstructionMeetingAction


class MeetingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self):
        return (
            select(ConstructionMeeting)
            .options(
                joinedload(ConstructionMeeting.creator),
                joinedload(ConstructionMeeting.actions),
            )
        )

    async def get_by_id(self, meeting_id: int) -> ConstructionMeeting | None:
        result = await self.db.execute(
            self._base_query().where(ConstructionMeeting.id == meeting_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionMeeting]:
        result = await self.db.execute(
            self._base_query()
            .where(ConstructionMeeting.project_id == project_id)
            .order_by(ConstructionMeeting.meeting_date.desc())
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict, actions: list[dict]) -> ConstructionMeeting:
        meeting = ConstructionMeeting(**data)
        self.db.add(meeting)
        await self.db.flush()
        for adict in actions:
            adict["meeting_id"] = meeting.id
            self.db.add(ConstructionMeetingAction(**adict))
        await self.db.flush()
        return (await self.get_by_id(meeting.id))  # type: ignore[return-value]

    async def update(self, meeting: ConstructionMeeting, data: dict) -> ConstructionMeeting:
        for key, value in data.items():
            setattr(meeting, key, value)
        await self.db.flush()
        return meeting

    async def delete(self, meeting: ConstructionMeeting) -> None:
        await self.db.delete(meeting)
        await self.db.flush()

    async def get_action(self, action_id: int) -> ConstructionMeetingAction | None:
        result = await self.db.execute(
            select(ConstructionMeetingAction).where(ConstructionMeetingAction.id == action_id)
        )
        return result.scalar_one_or_none()

    async def toggle_action(self, action: ConstructionMeetingAction) -> ConstructionMeetingAction:
        action.completed = not action.completed
        await self.db.flush()
        return action
