import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSafetyIncident,
  deleteSafetyIncident,
  fetchSafetyIncidents,
  fetchSafetyStats,
  updateSafetyIncident,
} from '../../api/endpoints/construction/safety';

export function useSafetyIncidents(projectId: number) {
  return useQuery({
    queryKey: ['construction-safety', projectId],
    queryFn: () => fetchSafetyIncidents(projectId),
    enabled: !!projectId,
  });
}

export function useSafetyStats(projectId: number) {
  return useQuery({
    queryKey: ['construction-safety-stats', projectId],
    queryFn: () => fetchSafetyStats(projectId),
    enabled: !!projectId,
  });
}

export function useCreateSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: number; body: Parameters<typeof createSafetyIncident>[1] }) =>
      createSafetyIncident(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-safety', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-safety-stats', projectId] });
    },
  });
}

export function useUpdateSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      incidentId,
      body,
    }: {
      projectId: number;
      incidentId: number;
      body: Parameters<typeof updateSafetyIncident>[2];
    }) => updateSafetyIncident(projectId, incidentId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-safety', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-safety-stats', projectId] });
    },
  });
}

export function useDeleteSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, incidentId }: { projectId: number; incidentId: number }) =>
      deleteSafetyIncident(projectId, incidentId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-safety', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-safety-stats', projectId] });
    },
  });
}
