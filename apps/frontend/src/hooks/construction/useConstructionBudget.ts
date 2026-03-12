import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBudgetLine,
  deleteBudgetLine,
  fetchBudget,
  updateBudgetLine,
} from '../../api/endpoints/construction/budget';

export function useBudget(projectId: number) {
  return useQuery({
    queryKey: ['construction-budget', projectId],
    queryFn: () => fetchBudget(projectId),
    enabled: !!projectId,
  });
}

export function useCreateBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: number; body: Parameters<typeof createBudgetLine>[1] }) =>
      createBudgetLine(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-budget', projectId] });
    },
  });
}

export function useUpdateBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      lineId,
      body,
    }: {
      projectId: number;
      lineId: number;
      body: Parameters<typeof updateBudgetLine>[2];
    }) => updateBudgetLine(projectId, lineId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-budget', projectId] });
    },
  });
}

export function useDeleteBudgetLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, lineId }: { projectId: number; lineId: number }) =>
      deleteBudgetLine(projectId, lineId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-budget', projectId] });
    },
  });
}
