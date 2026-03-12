import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addTeamMember,
  fetchProjectTeam,
  fetchTotalTeamCount,
  removeTeamMember,
  updateTeamMember,
} from '../../api/endpoints/construction/team';

export function useTotalTeamCount() {
  return useQuery({
    queryKey: ['construction-team-count'],
    queryFn: fetchTotalTeamCount,
  });
}

export function useProjectTeam(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-team', projectId],
    queryFn: () => fetchProjectTeam(projectId!),
    enabled: projectId !== undefined,
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof addTeamMember>[1];
    }) => addTeamMember(projectId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-team', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-projects'] });
      qc.invalidateQueries({ queryKey: ['construction-project', projectId] });
    },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      memberId,
      body,
    }: {
      projectId: number;
      memberId: number;
      body: Parameters<typeof updateTeamMember>[2];
    }) => updateTeamMember(projectId, memberId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-team', projectId] });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: number; memberId: number }) =>
      removeTeamMember(projectId, memberId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-team', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-projects'] });
      qc.invalidateQueries({ queryKey: ['construction-project', projectId] });
    },
  });
}
