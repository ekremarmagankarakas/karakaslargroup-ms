import api from '../../axios';
import type { ConstructionProject } from '../../../types';

export interface FavoriteToggleResponse {
  is_favorite: boolean;
}

export async function toggleProjectFavorite(projectId: number): Promise<FavoriteToggleResponse> {
  const { data } = await api.post(`/construction/${projectId}/favorite`);
  return data;
}

export async function fetchFavoriteProjects(): Promise<ConstructionProject[]> {
  const { data } = await api.get('/construction/favorites');
  return data;
}
