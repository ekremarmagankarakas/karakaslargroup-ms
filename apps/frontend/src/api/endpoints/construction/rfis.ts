import api from '../../axios';
import type { ConstructionRFI, RFIPriority } from '../../../types';

export async function fetchRFIs(projectId: number): Promise<ConstructionRFI[]> {
  const { data } = await api.get(`/construction/${projectId}/rfis`);
  return data;
}

export async function createRFI(
  projectId: number,
  body: {
    subject: string;
    question: string;
    submitted_to: string;
    priority?: RFIPriority;
    due_date?: string;
  },
): Promise<ConstructionRFI> {
  const { data } = await api.post(`/construction/${projectId}/rfis`, body);
  return data;
}

export async function updateRFI(
  projectId: number,
  rfiId: number,
  body: Partial<{
    subject: string;
    question: string;
    response: string | null;
    status: string;
    priority: RFIPriority;
    submitted_to: string;
    submitted_date: string | null;
    response_date: string | null;
    due_date: string | null;
    answered_by_name: string | null;
  }>,
): Promise<ConstructionRFI> {
  const { data } = await api.patch(`/construction/${projectId}/rfis/${rfiId}`, body);
  return data;
}

export async function deleteRFI(projectId: number, rfiId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/rfis/${rfiId}`);
}
