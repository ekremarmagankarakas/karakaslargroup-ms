import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createIssue, deleteIssue, fetchIssues, updateIssue } from '../../api/endpoints/construction/issues';

export function useIssues(projectId: number) {
  return useQuery({
    queryKey: ['construction-issues', projectId],
    queryFn: () => fetchIssues(projectId),
    enabled: !!projectId,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: number; body: Parameters<typeof createIssue>[1] }) =>
      createIssue(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-issues', projectId] });
    },
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      issueId,
      body,
    }: {
      projectId: number;
      issueId: number;
      body: Parameters<typeof updateIssue>[2];
    }) => updateIssue(projectId, issueId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-issues', projectId] });
    },
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, issueId }: { projectId: number; issueId: number }) =>
      deleteIssue(projectId, issueId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-issues', projectId] });
    },
  });
}
