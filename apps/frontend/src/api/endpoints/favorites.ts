import api from '../axios';
import type { PaginatedResponse, Requirement } from '../../types';

export async function fetchFavorites(page: number, limit = 10): Promise<PaginatedResponse<Requirement>> {
  const response = await api.get<PaginatedResponse<Requirement>>('/favorites/', { params: { page, limit } });
  return response.data;
}

export async function addFavorite(requirementId: number): Promise<void> {
  await api.post(`/favorites/${requirementId}`);
}

export async function removeFavorite(requirementId: number): Promise<void> {
  await api.delete(`/favorites/${requirementId}`);
}
