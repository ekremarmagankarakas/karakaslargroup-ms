import { useQuery } from '@tanstack/react-query';
import { fetchLocationStats, fetchSpendOverTime, fetchTopRequesters } from '../api/endpoints/analytics';
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

export function useLocationStats(filters: Pick<AnalyticsFilters, 'month' | 'year'>) {
  return useQuery({
    queryKey: ['analytics', 'by-location', filters],
    queryFn: () => fetchLocationStats(filters),
  });
}
