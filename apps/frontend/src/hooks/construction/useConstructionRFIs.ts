import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRFI, deleteRFI, fetchRFIs, updateRFI } from '../../api/endpoints/construction/rfis';

export function useRFIs(projectId: number) {
  return useQuery({
    queryKey: ['construction-rfis', projectId],
    queryFn: () => fetchRFIs(projectId),
    enabled: !!projectId,
  });
}

export function useCreateRFI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: number; body: Parameters<typeof createRFI>[1] }) =>
      createRFI(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-rfis', projectId] });
    },
  });
}

export function useUpdateRFI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      rfiId,
      body,
    }: {
      projectId: number;
      rfiId: number;
      body: Parameters<typeof updateRFI>[2];
    }) => updateRFI(projectId, rfiId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-rfis', projectId] });
    },
  });
}

export function useDeleteRFI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, rfiId }: { projectId: number; rfiId: number }) =>
      deleteRFI(projectId, rfiId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-rfis', projectId] });
    },
  });
}
