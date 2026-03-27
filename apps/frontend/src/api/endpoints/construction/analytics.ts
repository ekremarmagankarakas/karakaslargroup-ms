import api from '../../axios';
import type { ConstructionAnalyticsResponse } from '../../../types';

export async function fetchConstructionAnalytics(): Promise<ConstructionAnalyticsResponse> {
  const { data } = await api.get('/construction/analytics');
  return data;
}
