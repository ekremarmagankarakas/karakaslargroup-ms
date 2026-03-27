import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPunchListItem,
  deletePunchListItem,
  fetchPunchList,
  updatePunchListItem,
  verifyPunchListItem,
} from '../../api/endpoints/construction/punchList';
import type { PunchListStatus } from '../../types';

export function usePunchList(projectId: number, status?: PunchListStatus) {
  return useQuery({
    queryKey: ['construction-punch-list', projectId, status],
    queryFn: () => fetchPunchList(projectId, status),
    enabled: !!projectId,
  });
}

export function useCreatePunchListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: number; body: Parameters<typeof createPunchListItem>[1] }) =>
      createPunchListItem(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-punch-list', projectId] });
    },
  });
}

export function useUpdatePunchListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      itemId,
      body,
    }: {
      projectId: number;
      itemId: number;
      body: Parameters<typeof updatePunchListItem>[2];
    }) => updatePunchListItem(projectId, itemId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-punch-list', projectId] });
    },
  });
}

export function useVerifyPunchListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, itemId }: { projectId: number; itemId: number }) =>
      verifyPunchListItem(projectId, itemId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-punch-list', projectId] });
    },
  });
}

export function useDeletePunchListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, itemId }: { projectId: number; itemId: number }) =>
      deletePunchListItem(projectId, itemId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-punch-list', projectId] });
    },
  });
}
