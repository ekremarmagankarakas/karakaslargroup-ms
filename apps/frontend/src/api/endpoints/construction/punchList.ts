import api from '../../axios';
import type { ConstructionPunchListItem, PunchListStatus } from '../../../types';

export async function fetchPunchList(projectId: number, status?: PunchListStatus): Promise<ConstructionPunchListItem[]> {
  const { data } = await api.get(`/construction/${projectId}/punch-list`, {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function createPunchListItem(
  projectId: number,
  body: {
    title: string;
    description?: string;
    location_on_site?: string;
    subcontractor_id?: number;
    assigned_to?: number;
    due_date?: string;
  },
): Promise<ConstructionPunchListItem> {
  const { data } = await api.post(`/construction/${projectId}/punch-list`, body);
  return data;
}

export async function updatePunchListItem(
  projectId: number,
  itemId: number,
  body: Partial<{
    title: string;
    description: string | null;
    location_on_site: string | null;
    status: PunchListStatus;
    due_date: string | null;
    completed_date: string | null;
  }>,
): Promise<ConstructionPunchListItem> {
  const { data } = await api.patch(`/construction/${projectId}/punch-list/${itemId}`, body);
  return data;
}

export async function verifyPunchListItem(projectId: number, itemId: number): Promise<ConstructionPunchListItem> {
  const { data } = await api.post(`/construction/${projectId}/punch-list/${itemId}/verify`);
  return data;
}

export async function deletePunchListItem(projectId: number, itemId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/punch-list/${itemId}`);
}
