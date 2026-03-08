import api from '../axios';
import type { AnalyticsFilters, SpendOverTimeResponse, TopRequestersResponse } from '../../types';

export async function fetchSpendOverTime(filters: AnalyticsFilters): Promise<SpendOverTimeResponse> {
  const response = await api.get<SpendOverTimeResponse>('/statistics/spend-over-time', { params: filters });
  return response.data;
}

export async function fetchTopRequesters(limit: number, filters: AnalyticsFilters): Promise<TopRequestersResponse> {
  const response = await api.get<TopRequestersResponse>('/statistics/top-requesters', {
    params: { limit, ...filters },
  });
  return response.data;
}
