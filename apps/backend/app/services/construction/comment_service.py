from fastapi import HTTPException

from app.models.user import User, UserRole
from app.repositories.construction.comment_repository import ConstructionCommentRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.comment import CommentCreate, CommentResponse


def _build_comment_response(comment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        project_id=comment.project_id,
        user_id=comment.user_id,
        username=comment.user.username if comment.user else None,
        content=comment.content,
        created_at=comment.created_at,
    )


class ConstructionCommentService:
    def __init__(
        self,
        comment_repo: ConstructionCommentRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.comment_repo = comment_repo
        self.project_repo = project_repo

    async def list_comments(self, project_id: int) -> list[CommentResponse]:
        comments = await self.comment_repo.get_by_project(project_id)
        return [_build_comment_response(c) for c in comments]

    async def create_comment(
        self, current_user: User, project_id: int, body: CommentCreate
    ) -> CommentResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        if not body.content.strip():
            raise HTTPException(status_code=400, detail="Yorum içeriği boş olamaz")

        comment = await self.comment_repo.create(
            {
                "project_id": project_id,
                "user_id": current_user.id,
                "content": body.content.strip(),
            }
        )
        return _build_comment_response(comment)

    async def delete_comment(
        self, current_user: User, project_id: int, comment_id: int
    ) -> None:
        comment = await self.comment_repo.get_by_id(comment_id)
        if not comment or comment.project_id != project_id:
            raise HTTPException(status_code=404, detail="Yorum bulunamadı")

        is_owner = comment.user_id == current_user.id
        is_privileged = current_user.role in (UserRole.manager, UserRole.admin)

        if not is_owner and not is_privileged:
            raise HTTPException(
                status_code=403, detail="Bu yorumu silme yetkiniz yok"
            )

        await self.comment_repo.delete(comment)
