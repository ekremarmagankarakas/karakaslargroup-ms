import io
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.models.user import User
from app.repositories.construction.document_repository import ConstructionDocumentRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.document import DocumentResponse
from app.services.storage_service import StorageService


def _build_document_response(doc, storage: StorageService) -> DocumentResponse:
    url = storage.get_presigned_url(doc.file_key) if doc.file_key else ""
    return DocumentResponse(
        id=doc.id,
        project_id=doc.project_id,
        uploaded_by=doc.uploaded_by,
        uploader_username=doc.uploader.username if doc.uploader else None,
        file_key=doc.file_key,
        url=url,
        original_filename=doc.original_filename,
        file_size_bytes=doc.file_size_bytes,
        document_type=doc.document_type,
        caption=doc.caption,
        created_at=doc.created_at,
    )


class ConstructionDocumentService:
    def __init__(
        self,
        doc_repo: ConstructionDocumentRepository,
        project_repo: ConstructionProjectRepository,
        storage: StorageService,
    ) -> None:
        self.doc_repo = doc_repo
        self.project_repo = project_repo
        self.storage = storage

    async def list_documents(self, project_id: int) -> list[DocumentResponse]:
        docs = await self.doc_repo.get_by_project(project_id)
        return [_build_document_response(d, self.storage) for d in docs]

    async def upload_document(
        self,
        current_user: User,
        project_id: int,
        file: UploadFile,
        document_type: str | None,
        caption: str | None,
    ) -> DocumentResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

        content = await file.read()
        content_type = file.content_type or "application/octet-stream"
        original_filename = file.filename or "document"
        ext = Path(original_filename).suffix.lower() or ""
        file_key = f"construction_documents/{project_id}/{uuid4()}{ext}"

        self.storage.client.upload_fileobj(
            io.BytesIO(content),
            self.storage.bucket,
            file_key,
            ExtraArgs={"ContentType": content_type},
        )

        doc = await self.doc_repo.create(
            {
                "project_id": project_id,
                "uploaded_by": current_user.id,
                "file_key": file_key,
                "original_filename": original_filename,
                "file_size_bytes": len(content),
                "document_type": document_type,
                "caption": caption,
            }
        )
        doc = await self.doc_repo.get_by_id(doc.id)
        return _build_document_response(doc, self.storage)

    async def delete_document(
        self, current_user: User, project_id: int, doc_id: int
    ) -> None:
        doc = await self.doc_repo.get_by_id(doc_id)
        if not doc or doc.project_id != project_id:
            raise HTTPException(status_code=404, detail="Belge bulunamadı")

        try:
            self.storage.client.delete_object(
                Bucket=self.storage.bucket,
                Key=doc.file_key,
            )
        except Exception:
            pass  # best-effort S3 deletion

        await self.doc_repo.delete(doc)
