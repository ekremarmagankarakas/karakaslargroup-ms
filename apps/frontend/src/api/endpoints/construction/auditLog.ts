import api from '../../axios';
import type { ConstructionAuditLog } from '../../../types';

export async function fetchProjectAuditLog(projectId: number): Promise<ConstructionAuditLog[]> {
  const { data } = await api.get(`/construction/${projectId}/audit-log`);
  return data;
}
