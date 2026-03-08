import { useQuery } from '@tanstack/react-query';
import { fetchSpendOverTime, fetchTopRequesters } from '../api/endpoints/analytics';
import type { AnalyticsFilters } from '../types';

export function useSpendOverTime(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'spend-over-time', filters],
    queryFn: () => fetchSpendOverTime(filters),
  });
}

export function useTopRequesters(limit: number, filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'top-requesters', limit, filters],
    queryFn: () => fetchTopRequesters(limit, filters),
  });
}
