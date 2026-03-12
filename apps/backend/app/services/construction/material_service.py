from fastapi import HTTPException, status

from app.repositories.construction.material_repository import ConstructionMaterialRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.material import MaterialCreate, MaterialResponse, MaterialUpdate


class ConstructionMaterialService:
    def __init__(
        self,
        material_repo: ConstructionMaterialRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.material_repo = material_repo
        self.project_repo = project_repo

    async def list_materials(self, project_id: int) -> list[MaterialResponse]:
        await self._require_project(project_id)
        materials = await self.material_repo.get_by_project(project_id)
        return [MaterialResponse.model_validate(m) for m in materials]

    async def add_material(self, project_id: int, body: MaterialCreate) -> MaterialResponse:
        await self._require_project(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        material = await self.material_repo.create(data)
        return MaterialResponse.model_validate(material)

    async def update_material(
        self, project_id: int, material_id: int, body: MaterialUpdate
    ) -> MaterialResponse:
        material = await self._require_material(project_id, material_id)
        updates = body.model_dump(exclude_unset=True)
        material = await self.material_repo.update(material, updates)
        return MaterialResponse.model_validate(material)

    async def delete_material(self, project_id: int, material_id: int) -> None:
        material = await self._require_material(project_id, material_id)
        await self.material_repo.delete(material)

    async def _require_project(self, project_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")

    async def _require_material(self, project_id: int, material_id: int):
        material = await self.material_repo.get_by_id(material_id)
        if not material or material.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Malzeme bulunamadı")
        return material
