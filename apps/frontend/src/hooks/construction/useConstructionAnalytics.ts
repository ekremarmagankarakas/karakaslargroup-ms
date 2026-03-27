import { useQuery } from '@tanstack/react-query';
import { fetchConstructionAnalytics } from '../../api/endpoints/construction/analytics';

export function useConstructionAnalytics() {
  return useQuery({
    queryKey: ['construction-analytics'],
    queryFn: fetchConstructionAnalytics,
  });
}
