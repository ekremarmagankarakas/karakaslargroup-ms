import { useQuery } from '@tanstack/react-query';
import { fetchSCurve } from '../../api/endpoints/construction/scurve';

export function useSCurve(projectId: number) {
  return useQuery({
    queryKey: ['construction-scurve', projectId],
    queryFn: () => fetchSCurve(projectId),
  });
}
