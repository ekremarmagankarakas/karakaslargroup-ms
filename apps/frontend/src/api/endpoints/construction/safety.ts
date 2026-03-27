import api from '../../axios';
import type { ConstructionSafetyIncident, SafetyStatsResponse } from '../../../types';

export async function fetchSafetyIncidents(projectId: number): Promise<ConstructionSafetyIncident[]> {
  const { data } = await api.get(`/construction/${projectId}/safety`);
  return data;
}

export async function fetchSafetyStats(projectId: number): Promise<SafetyStatsResponse> {
  const { data } = await api.get(`/construction/${projectId}/safety/stats`);
  return data;
}

export async function createSafetyIncident(
  projectId: number,
  body: {
    incident_type: string;
    title: string;
    description: string;
    location_on_site?: string;
    incident_date: string;
    injured_person_name?: string;
    time_lost_days?: number;
    root_cause?: string;
    corrective_actions?: string;
  },
): Promise<ConstructionSafetyIncident> {
  const { data } = await api.post(`/construction/${projectId}/safety`, body);
  return data;
}

export async function updateSafetyIncident(
  projectId: number,
  incidentId: number,
  body: Partial<{
    incident_type: string;
    title: string;
    description: string;
    location_on_site: string | null;
    incident_date: string;
    injured_person_name: string | null;
    time_lost_days: number | null;
    root_cause: string | null;
    corrective_actions: string | null;
    status: string;
  }>,
): Promise<ConstructionSafetyIncident> {
  const { data } = await api.patch(`/construction/${projectId}/safety/${incidentId}`, body);
  return data;
}

export async function deleteSafetyIncident(projectId: number, incidentId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/safety/${incidentId}`);
}
