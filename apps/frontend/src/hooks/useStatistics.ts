import { useQuery } from '@tanstack/react-query';
import { fetchStatistics } from '../api/endpoints/statistics';
import type { StatisticsFilters } from '../types';

export function useStatistics(filters: StatisticsFilters) {
  return useQuery({
    queryKey: ['statistics', filters],
    queryFn: () => fetchStatistics(filters),
  });
}
