import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveChangeOrder,
  createChangeOrder,
  deleteChangeOrder,
  fetchChangeOrders,
  rejectChangeOrder,
  submitChangeOrder,
} from '../../api/endpoints/construction/changeOrders';

export function useChangeOrders(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-change-orders', projectId],
    queryFn: () => fetchChangeOrders(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateChangeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createChangeOrder>[1];
    }) => createChangeOrder(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-change-orders', projectId] });
    },
  });
}

export function useSubmitChangeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, coId }: { projectId: number; coId: number }) =>
      submitChangeOrder(projectId, coId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['construction-change-orders', data.project_id] });
    },
  });
}

export function useApproveChangeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, coId }: { projectId: number; coId: number }) =>
      approveChangeOrder(projectId, coId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['construction-change-orders', data.project_id] });
    },
  });
}

export function useRejectChangeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, coId }: { projectId: number; coId: number }) =>
      rejectChangeOrder(projectId, coId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['construction-change-orders', data.project_id] });
    },
  });
}

export function useDeleteChangeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, coId }: { projectId: number; coId: number }) =>
      deleteChangeOrder(projectId, coId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-change-orders', projectId] });
    },
  });
}
