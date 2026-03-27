import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDailyLog,
  deleteDailyLog,
  fetchDailyLogs,
  updateDailyLog,
} from '../../api/endpoints/construction/dailyLogs';

export function useDailyLogs(projectId: number, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['construction-daily-logs', projectId, page, limit],
    queryFn: () => fetchDailyLogs(projectId, page, limit),
    enabled: !!projectId,
  });
}

export function useCreateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createDailyLog>[1];
    }) => createDailyLog(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-daily-logs', projectId] });
    },
  });
}

export function useUpdateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      logId,
      body,
    }: {
      projectId: number;
      logId: number;
      body: Parameters<typeof updateDailyLog>[2];
    }) => updateDailyLog(projectId, logId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-daily-logs', projectId] });
    },
  });
}

export function useDeleteDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, logId }: { projectId: number; logId: number }) =>
      deleteDailyLog(projectId, logId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-daily-logs', projectId] });
    },
  });
}
