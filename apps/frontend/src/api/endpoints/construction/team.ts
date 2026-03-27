import api from '../../axios';
import type { ConstructionProjectMember, ConstructionProjectRole } from '../../../types';

export async function fetchProjectTeam(projectId: number): Promise<ConstructionProjectMember[]> {
  const { data } = await api.get(`/construction/${projectId}/team`);
  return data;
}

export async function addTeamMember(
  projectId: number,
  body: {
    user_id: number;
    construction_role: ConstructionProjectRole;
    joined_at?: string;
    notes?: string;
  },
): Promise<ConstructionProjectMember> {
  const { data } = await api.post(`/construction/${projectId}/team`, body);
  return data;
}

export async function updateTeamMember(
  projectId: number,
  memberId: number,
  body: Partial<{
    construction_role: ConstructionProjectRole;
    joined_at: string | null;
    notes: string | null;
  }>,
): Promise<ConstructionProjectMember> {
  const { data } = await api.patch(`/construction/${projectId}/team/${memberId}`, body);
  return data;
}

export async function removeTeamMember(
  projectId: number,
  memberId: number,
): Promise<void> {
  await api.delete(`/construction/${projectId}/team/${memberId}`);
}

export async function fetchTotalTeamCount(): Promise<number> {
  const { data } = await api.get('/construction/team/count');
  return data.count;
}
