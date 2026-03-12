from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.repositories.construction.issue_repository import ConstructionIssueRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.issue import IssueCreate, IssueResponse, IssueUpdate


def _build_issue_response(issue) -> IssueResponse:
    return IssueResponse(
        id=issue.id,
        project_id=issue.project_id,
        title=issue.title,
        description=issue.description,
        severity=issue.severity,
        status=issue.status,
        reported_by=issue.reported_by,
        reporter_username=issue.reporter.username if issue.reporter else None,
        created_at=issue.created_at,
    )


class ConstructionIssueService:
    def __init__(
        self,
        issue_repo: ConstructionIssueRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.issue_repo = issue_repo
        self.project_repo = project_repo

    async def list_issues(self, project_id: int) -> list[IssueResponse]:
        issues = await self.issue_repo.get_by_project(project_id)
        return [_build_issue_response(i) for i in issues]

    async def create_issue(
        self, current_user: User, project_id: int, body: IssueCreate
    ) -> IssueResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        data = body.model_dump()
        data["project_id"] = project_id
        data["reported_by"] = current_user.id
        issue = await self.issue_repo.create(data)
        return _build_issue_response(issue)

    async def update_issue(
        self, current_user: User, project_id: int, issue_id: int, body: IssueUpdate
    ) -> IssueResponse:
        issue = await self.issue_repo.get_by_id(issue_id)
        if not issue or issue.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sorun bulunamadı")
        if current_user.role not in (UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetersiz yetki")
        updates = body.model_dump(exclude_unset=True)
        await self.issue_repo.update(issue, updates)
        issue = await self.issue_repo.get_by_id(issue_id)
        return _build_issue_response(issue)  # type: ignore[arg-type]

    async def delete_issue(
        self, current_user: User, project_id: int, issue_id: int
    ) -> None:
        issue = await self.issue_repo.get_by_id(issue_id)
        if not issue or issue.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sorun bulunamadı")
        if current_user.role not in (UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetersiz yetki")
        await self.issue_repo.delete(issue)
