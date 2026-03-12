import io
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.models.user import User
from app.repositories.construction.photo_repository import ConstructionPhotoRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.photo import PhotoResponse
from app.services.storage_service import StorageService


def _build_photo_response(photo, storage: StorageService) -> PhotoResponse:
    url = storage.get_presigned_url(photo.file_key) if photo.file_key else ""
    return PhotoResponse(
        id=photo.id,
        project_id=photo.project_id,
        uploaded_by=photo.uploaded_by,
        uploader_username=photo.uploader.username if photo.uploader else None,
        file_key=photo.file_key,
        url=url,
        caption=photo.caption,
        created_at=photo.created_at,
    )


class ConstructionPhotoService:
    def __init__(
        self,
        photo_repo: ConstructionPhotoRepository,
        project_repo: ConstructionProjectRepository,
        storage: StorageService,
    ) -> None:
        self.photo_repo = photo_repo
        self.project_repo = project_repo
        self.storage = storage

    async def list_photos(self, project_id: int) -> list[PhotoResponse]:
        photos = await self.photo_repo.get_by_project(project_id)
        return [_build_photo_response(p, self.storage) for p in photos]

    async def upload_photo(
        self,
        current_user: User,
        project_id: int,
        file: UploadFile,
        caption: str | None,
    ) -> PhotoResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

        content = await file.read()
        content_type = file.content_type or "image/jpeg"
        ext = Path(file.filename or "photo.jpg").suffix.lower() or ".jpg"
        file_key = f"construction_photos/{project_id}/{uuid4()}{ext}"

        self.storage.client.upload_fileobj(
            io.BytesIO(content),
            self.storage.bucket,
            file_key,
            ExtraArgs={"ContentType": content_type},
        )

        photo = await self.photo_repo.create(
            {
                "project_id": project_id,
                "uploaded_by": current_user.id,
                "file_key": file_key,
                "caption": caption,
            }
        )
        return _build_photo_response(photo, self.storage)

    async def delete_photo(
        self, current_user: User, project_id: int, photo_id: int
    ) -> None:
        photo = await self.photo_repo.get_by_id(photo_id)
        if not photo or photo.project_id != project_id:
            raise HTTPException(status_code=404, detail="Fotoğraf bulunamadı")

        try:
            self.storage.client.delete_object(
                Bucket=self.storage.bucket,
                Key=photo.file_key,
            )
        except Exception:
            pass  # best-effort S3 deletion

        await self.photo_repo.delete(photo)
