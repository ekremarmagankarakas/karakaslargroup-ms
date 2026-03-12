import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPermit,
  deletePermit,
  fetchPermits,
  updatePermit,
} from '../../api/endpoints/construction/permits';

export function usePermits(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-permits', projectId],
    queryFn: () => fetchPermits(projectId!),
    enabled: !!projectId,
  });
}

export function useCreatePermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createPermit>[1];
    }) => createPermit(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-permits', projectId] });
    },
  });
}

export function useUpdatePermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      permitId,
      body,
    }: {
      projectId: number;
      permitId: number;
      body: Parameters<typeof updatePermit>[2];
    }) => updatePermit(projectId, permitId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-permits', projectId] });
    },
  });
}

export function useDeletePermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, permitId }: { projectId: number; permitId: number }) =>
      deletePermit(projectId, permitId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-permits', projectId] });
    },
  });
}
