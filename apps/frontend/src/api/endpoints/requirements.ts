import api from '../axios';
import type { PaginatedResponse, Requirement, RequirementFilters } from '../../types';

export async function fetchRequirements(filters: RequirementFilters): Promise<PaginatedResponse<Requirement>> {
  const response = await api.get<PaginatedResponse<Requirement>>('/requirements/', { params: filters });
  return response.data;
}

export async function createRequirement(data: {
  item_name: string;
  price: string;
  explanation?: string;
}): Promise<Requirement> {
  const response = await api.post<Requirement>('/requirements/', data);
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

export async function togglePaid(requirementId: number): Promise<void> {
  await api.patch(`/requirements/${requirementId}/paid`);
}

export async function deleteRequirement(requirementId: number): Promise<void> {
  await api.delete(`/requirements/${requirementId}`);
}
