from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.core.config import get_settings
from app.repositories.construction.document_repository import ConstructionDocumentRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.document import DocumentResponse
from app.services.construction.document_service import ConstructionDocumentService
from app.services.storage_service import StorageService

router = APIRouter()


def _get_service(db: AsyncSession) -> ConstructionDocumentService:
    return ConstructionDocumentService(
        doc_repo=ConstructionDocumentRepository(db),
        project_repo=ConstructionProjectRepository(db),
        storage=StorageService(get_settings()),
    )


@router.get("/{project_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_documents(project_id)


@router.post("/{project_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    project_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    document_type: str | None = Form(None),
    caption: str | None = Form(None),
):
    return await _get_service(db).upload_document(
        current_user, project_id, file, document_type, caption
    )


@router.delete("/{project_id}/documents/{doc_id}", status_code=204)
async def delete_document(
    project_id: int,
    doc_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_document(current_user, project_id, doc_id)
