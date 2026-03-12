import api from '../../axios';
import type { ConstructionDocument } from '../../../types';

export async function fetchDocuments(projectId: number): Promise<ConstructionDocument[]> {
  const { data } = await api.get(`/construction/${projectId}/documents`);
  return data;
}

export async function uploadDocument(
  projectId: number,
  formData: FormData
): Promise<ConstructionDocument> {
  const { data } = await api.post(`/construction/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteDocument(projectId: number, docId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/documents/${docId}`);
}
