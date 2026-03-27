import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSubcontractor,
  deleteSubcontractor,
  fetchSubcontractors,
  updateSubcontractor,
} from '../../api/endpoints/construction/subcontractors';

export function useSubcontractors(projectId: number) {
  return useQuery({
    queryKey: ['construction-subcontractors', projectId],
    queryFn: () => fetchSubcontractors(projectId),
    enabled: !!projectId,
  });
}

export function useCreateSubcontractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createSubcontractor>[1];
    }) => createSubcontractor(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-subcontractors', projectId] });
    },
  });
}

export function useUpdateSubcontractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      subId,
      body,
    }: {
      projectId: number;
      subId: number;
      body: Parameters<typeof updateSubcontractor>[2];
    }) => updateSubcontractor(projectId, subId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-subcontractors', projectId] });
    },
  });
}

export function useDeleteSubcontractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, subId }: { projectId: number; subId: number }) =>
      deleteSubcontractor(projectId, subId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-subcontractors', projectId] });
    },
  });
}
