import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRequirement,
  deleteRequirement,
  fetchRequirements,
  togglePaid,
  updateStatus,
  uploadImages,
} from '../api/endpoints/requirements';
import type { RequirementFilters } from '../types';

export const queryKeys = {
  requirements: (filters: RequirementFilters) => ['requirements', filters] as const,
  favorites: (page: number) => ['favorites', page] as const,
  statistics: (filters: object) => ['statistics', filters] as const,
  users: () => ['users'] as const,
};

export function useRequirements(filters: RequirementFilters) {
  return useQuery({
    queryKey: queryKeys.requirements(filters),
    queryFn: () => fetchRequirements(filters),
  });
}

export function useCreateRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      item_name: string;
      price: string;
      explanation?: string;
      files?: File[];
    }) => {
      const req = await createRequirement({
        item_name: data.item_name,
        price: data.price,
        explanation: data.explanation,
      });
      if (data.files && data.files.length > 0) {
        await uploadImages(req.id, data.files);
      }
      return req;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'declined' }) =>
      updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useTogglePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => togglePaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useDeleteRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRequirement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
