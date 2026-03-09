import api from '../axios';
import type { AuditLogEntry, Comment, PaginatedResponse, Requirement, RequirementFilters } from '../../types';

export async function fetchRequirements(filters: RequirementFilters): Promise<PaginatedResponse<Requirement>> {
  const response = await api.get<PaginatedResponse<Requirement>>('/requirements/', { params: filters });
  return response.data;
}

export async function createRequirement(data: {
  item_name: string;
  price: string;
  explanation?: string;
  location_id?: number;
  priority?: string;
  needed_by?: string;
  category_id?: number;
}): Promise<Requirement> {
  const response = await api.post<Requirement>('/requirements/', data);
  return response.data;
}

export async function editRequirement(
  requirementId: number,
  data: { item_name?: string; price?: string; explanation?: string; priority?: string; needed_by?: string | null; category_id?: number | null }
): Promise<Requirement> {
  const response = await api.patch<Requirement>(`/requirements/${requirementId}`, data);
  return response.data;
}

export async function uploadImages(requirementId: number, files: File[]): Promise<void> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  await api.post(`/requirements/${requirementId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function updateStatus(
  requirementId: number,
  status: 'accepted' | 'declined'
): Promise<Requirement> {
  const response = await api.patch<Requirement>(`/requirements/${requirementId}/status`, { status });
  return response.data;
}

export async function bulkUpdateStatus(
  ids: number[],
  status: 'accepted' | 'declined'
): Promise<Requirement[]> {
  const response = await api.patch<Requirement[]>('/requirements/bulk-status', { ids, status });
  return response.data;
}

export async function togglePaid(requirementId: number): Promise<void> {
  await api.patch(`/requirements/${requirementId}/paid`);
}

export async function deleteRequirement(requirementId: number): Promise<void> {
  await api.delete(`/requirements/${requirementId}`);
}

export async function exportRequirements(filters: Omit<RequirementFilters, 'page' | 'limit'>): Promise<void> {
  const response = await api.get('/requirements/export', {
    params: filters,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'talepler.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function fetchComments(requirementId: number): Promise<Comment[]> {
  const response = await api.get<Comment[]>(`/requirements/${requirementId}/comments`);
  return response.data;
}

export async function createComment(requirementId: number, body: string): Promise<Comment> {
  const response = await api.post<Comment>(`/requirements/${requirementId}/comments`, { body });
  return response.data;
}

export async function fetchAuditLog(requirementId: number): Promise<AuditLogEntry[]> {
  const response = await api.get<AuditLogEntry[]>(`/requirements/${requirementId}/audit`);
  return response.data;
}
