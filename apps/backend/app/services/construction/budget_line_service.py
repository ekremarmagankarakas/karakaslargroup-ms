from fastapi import HTTPException, status

from app.repositories.construction.budget_line_repository import BudgetLineRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.budget_line import (
    BudgetLineCreate,
    BudgetLineResponse,
    BudgetLineUpdate,
    BudgetSummaryResponse,
)


def _to_response(line) -> BudgetLineResponse:
    return BudgetLineResponse.model_validate(line)


class BudgetLineService:
    def __init__(
        self,
        line_repo: BudgetLineRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.line_repo = line_repo
        self.project_repo = project_repo

    async def get_summary(self, project_id: int) -> BudgetSummaryResponse:
        await self._require_project(project_id)
        summary = await self.line_repo.get_summary(project_id)
        return BudgetSummaryResponse(
            lines=[_to_response(ln) for ln in summary["lines"]],
            total_planned=summary["total_planned"],
            total_actual=summary["total_actual"],
            variance=summary["variance"],
            utilization_pct=summary["utilization_pct"],
        )

    async def create_line(self, project_id: int, body: BudgetLineCreate) -> BudgetLineResponse:
        await self._require_project(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        line = await self.line_repo.create(data)
        return _to_response(line)

    async def update_line(self, project_id: int, line_id: int, body: BudgetLineUpdate) -> BudgetLineResponse:
        line = await self._require_line(project_id, line_id)
        updates = body.model_dump(exclude_unset=True)
        await self.line_repo.update(line, updates)
        line = await self.line_repo.get_by_id(line_id)
        return _to_response(line)

    async def delete_line(self, project_id: int, line_id: int) -> None:
        line = await self._require_line(project_id, line_id)
        await self.line_repo.delete(line)

    async def _require_project(self, project_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")

    async def _require_line(self, project_id: int, line_id: int):
        line = await self.line_repo.get_by_id(line_id)
        if not line or line.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bütçe kalemi bulunamadı")
        return line
