import api from '../../axios';
import type { ConstructionPhoto } from '../../../types';

export async function fetchPhotos(projectId: number): Promise<ConstructionPhoto[]> {
  const { data } = await api.get(`/construction/${projectId}/photos`);
  return data;
}

export async function uploadPhoto(projectId: number, formData: FormData): Promise<ConstructionPhoto> {
  const { data } = await api.post(`/construction/${projectId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deletePhoto(projectId: number, photoId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/photos/${photoId}`);
}
