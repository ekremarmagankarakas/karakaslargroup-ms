from fastapi import HTTPException, status

from app.repositories.construction.milestone_repository import ConstructionMilestoneRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.milestone import MilestoneCreate, MilestoneResponse, MilestoneUpdate


class ConstructionMilestoneService:
    def __init__(
        self,
        milestone_repo: ConstructionMilestoneRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.milestone_repo = milestone_repo
        self.project_repo = project_repo

    async def list_milestones(self, project_id: int) -> list[MilestoneResponse]:
        await self._require_project(project_id)
        milestones = await self.milestone_repo.get_by_project(project_id)
        return [MilestoneResponse.model_validate(m) for m in milestones]

    async def add_milestone(self, project_id: int, body: MilestoneCreate) -> MilestoneResponse:
        await self._require_project(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        milestone = await self.milestone_repo.create(data)
        await self._sync_project_progress(project_id)
        return MilestoneResponse.model_validate(milestone)

    async def update_milestone(
        self, project_id: int, milestone_id: int, body: MilestoneUpdate
    ) -> MilestoneResponse:
        milestone = await self._require_milestone(project_id, milestone_id)
        updates = body.model_dump(exclude_unset=True)
        milestone = await self.milestone_repo.update(milestone, updates)
        await self._sync_project_progress(project_id)
        return MilestoneResponse.model_validate(milestone)

    async def delete_milestone(self, project_id: int, milestone_id: int) -> None:
        milestone = await self._require_milestone(project_id, milestone_id)
        await self.milestone_repo.delete(milestone)
        await self._sync_project_progress(project_id)

    async def _require_project(self, project_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")

    async def _require_milestone(self, project_id: int, milestone_id: int):
        milestone = await self.milestone_repo.get_by_id(milestone_id)
        if not milestone or milestone.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aşama bulunamadı")
        return milestone

    async def _sync_project_progress(self, project_id: int) -> None:
        avg = await self.milestone_repo.get_avg_completion(project_id)
        project = await self.project_repo.get_by_id(project_id)
        if project:
            await self.project_repo.update(project, {"progress_pct": avg})
