import api from '../../axios';
import type { ConstructionDailyLog, PaginatedResponse, WeatherCondition } from '../../../types';

export async function fetchDailyLogs(
  projectId: number,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<ConstructionDailyLog>> {
  const { data } = await api.get(`/construction/${projectId}/daily-logs`, {
    params: { page, limit },
  });
  return data;
}

export async function createDailyLog(
  projectId: number,
  body: {
    log_date: string;
    weather?: WeatherCondition;
    temperature_c?: number | null;
    worker_count?: number;
    work_summary: string;
    equipment_on_site?: string | null;
    visitors?: string | null;
  }
): Promise<ConstructionDailyLog> {
  const { data } = await api.post(`/construction/${projectId}/daily-logs`, body);
  return data;
}

export async function updateDailyLog(
  projectId: number,
  logId: number,
  body: {
    weather?: WeatherCondition;
    temperature_c?: number | null;
    worker_count?: number;
    work_summary?: string;
    equipment_on_site?: string | null;
    visitors?: string | null;
  }
): Promise<ConstructionDailyLog> {
  const { data } = await api.patch(`/construction/${projectId}/daily-logs/${logId}`, body);
  return data;
}

export async function deleteDailyLog(projectId: number, logId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/daily-logs/${logId}`);
}
