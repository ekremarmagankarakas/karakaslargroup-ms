from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.repositories.construction.comment_repository import ConstructionCommentRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.comment import CommentCreate, CommentResponse
from app.services.construction.comment_service import ConstructionCommentService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionCommentService:
    return ConstructionCommentService(
        comment_repo=ConstructionCommentRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/{project_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_comments(project_id)


@router.post("/{project_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    project_id: int,
    body: CommentCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_comment(current_user, project_id, body)


@router.delete("/{project_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    project_id: int,
    comment_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_comment(current_user, project_id, comment_id)
