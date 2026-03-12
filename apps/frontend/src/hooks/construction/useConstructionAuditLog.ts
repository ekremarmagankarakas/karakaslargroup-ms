import { useQuery } from '@tanstack/react-query';
import { fetchProjectAuditLog } from '../../api/endpoints/construction/auditLog';

export function useProjectAuditLog(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-audit-log', projectId],
    queryFn: () => fetchProjectAuditLog(projectId!),
    enabled: !!projectId,
  });
}
