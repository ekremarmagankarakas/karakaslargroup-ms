import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkUpdateStatus,
  createComment,
  createRequirement,
  deleteRequirement,
  editRequirement,
  fetchAuditLog,
  fetchComments,
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
      location_id?: number;
      priority?: string;
      needed_by?: string;
      category_id?: number;
      files?: File[];
    }) => {
      const req = await createRequirement({
        item_name: data.item_name,
        price: data.price,
        explanation: data.explanation,
        location_id: data.location_id,
        priority: data.priority,
        needed_by: data.needed_by,
        category_id: data.category_id,
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

    onMutate: async ({ id, status }) => {
      // Cancel in-flight refetches so they don't overwrite the optimistic update
      await qc.cancelQueries({ queryKey: ['requirements'] });

      // Snapshot all requirements cache entries for rollback
      const snapshots = qc.getQueriesData<any>({ queryKey: ['requirements'] });

      // Apply the toggle logic optimistically (mirrors backend toggle behaviour)
      qc.setQueriesData<any>({ queryKey: ['requirements'] }, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.id === id
              ? { ...item, status: item.status === status ? 'pending' : status }
              : item
          ),
        };
      });

      return { snapshots };
    },

    onError: (_err, _vars, context) => {
      // Roll back to snapshot on failure
      context?.snapshots?.forEach(([key, data]: [any, any]) =>
        qc.setQueryData(key, data)
      );
    },

    onSettled: () => {
      // Sync stats and favorites immediately — they're small and non-visual
      qc.invalidateQueries({ queryKey: ['statistics'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      // Mark requirements stale but don't actively refetch — the optimistic
      // update already shows the correct state, and an active refetch can
      // return items in a different position even with deterministic sorting
      // if the response races with other mutations. Data will resync on the
      // next navigation or window focus.
      qc.invalidateQueries({ queryKey: ['requirements'], refetchType: 'none' });
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

export function useEditRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { item_name?: string; price?: string; explanation?: string } }) =>
      editRequirement(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: 'accepted' | 'declined' }) =>
      bulkUpdateStatus(ids, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['statistics'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useComments(requirementId: number) {
  return useQuery({
    queryKey: ['comments', requirementId],
    queryFn: () => fetchComments(requirementId),
    enabled: requirementId > 0,
  });
}

export function useCreateComment(requirementId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(requirementId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', requirementId] });
    },
  });
}

export function useAuditLog(requirementId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['audit', requirementId],
    queryFn: () => fetchAuditLog(requirementId),
    enabled: enabled && requirementId > 0,
  });
}
