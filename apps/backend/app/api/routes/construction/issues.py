from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.issue_repository import ConstructionIssueRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.issue import IssueCreate, IssueResponse, IssueUpdate
from app.services.construction.issue_service import ConstructionIssueService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionIssueService:
    return ConstructionIssueService(
        issue_repo=ConstructionIssueRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/issues", response_model=list[IssueResponse])
async def list_issues(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.list_issues(project_id)


@router.post("/{project_id}/issues", response_model=IssueResponse, status_code=201)
async def create_issue(
    project_id: int,
    body: IssueCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.create_issue(current_user, project_id, body)


@router.patch("/{project_id}/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(
    project_id: int,
    issue_id: int,
    body: IssueUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_issue(current_user, project_id, issue_id, body)


@router.delete("/{project_id}/issues/{issue_id}", status_code=204)
async def delete_issue(
    project_id: int,
    issue_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_issue(current_user, project_id, issue_id)
