import api from '../../axios';
import type { StatisticsFilters, StatisticsResponse } from '../../../types';

export async function fetchStatistics(filters: StatisticsFilters): Promise<StatisticsResponse> {
  const response = await api.get<StatisticsResponse>('/statistics/', { params: filters });
  return response.data;
}
