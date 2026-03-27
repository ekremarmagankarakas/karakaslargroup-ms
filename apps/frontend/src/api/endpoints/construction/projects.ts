import api from '../../axios';
import type {
  ConstructionMaterial,
  ConstructionMilestone,
  ConstructionProject,
  ConstructionProjectFilters,
  PaginatedResponse,
} from '../../../types';

// ── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects(
  filters: ConstructionProjectFilters,
): Promise<PaginatedResponse<ConstructionProject>> {
  const { data } = await api.get('/construction/', { params: filters });
  return data;
}

export async function fetchProject(id: number): Promise<ConstructionProject> {
  const { data } = await api.get(`/construction/${id}`);
  return data;
}

export async function createProject(body: {
  name: string;
  description?: string;
  location_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
}): Promise<ConstructionProject> {
  const { data } = await api.post('/construction/', body);
  return data;
}

export async function updateProject(
  id: number,
  body: Partial<{
    name: string;
    description: string;
    location_id: number | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    budget: string | null;
    progress_pct: number;
  }>,
): Promise<ConstructionProject> {
  const { data } = await api.patch(`/construction/${id}`, body);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/construction/${id}`);
}

// ── Materials ─────────────────────────────────────────────────────────────────

export async function fetchMaterials(projectId: number): Promise<ConstructionMaterial[]> {
  const { data } = await api.get(`/construction/${projectId}/materials`);
  return data;
}

export async function createMaterial(
  projectId: number,
  body: {
    name: string;
    material_type: string;
    unit: string;
    quantity_planned: string;
    quantity_used?: string;
    unit_cost?: string;
    notes?: string;
  },
): Promise<ConstructionMaterial> {
  const { data } = await api.post(`/construction/${projectId}/materials`, body);
  return data;
}

export async function updateMaterial(
  projectId: number,
  materialId: number,
  body: Partial<{
    name: string;
    material_type: string;
    unit: string;
    quantity_planned: string;
    quantity_used: string;
    unit_cost: string | null;
    notes: string | null;
  }>,
): Promise<ConstructionMaterial> {
  const { data } = await api.patch(`/construction/${projectId}/materials/${materialId}`, body);
  return data;
}

export async function deleteMaterial(projectId: number, materialId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/materials/${materialId}`);
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function fetchMilestones(projectId: number): Promise<ConstructionMilestone[]> {
  const { data } = await api.get(`/construction/${projectId}/milestones`);
  return data;
}

export async function createMilestone(
  projectId: number,
  body: {
    title: string;
    description?: string;
    due_date?: string;
    status?: string;
    completion_pct?: number;
  },
): Promise<ConstructionMilestone> {
  const { data } = await api.post(`/construction/${projectId}/milestones`, body);
  return data;
}

export async function updateMilestone(
  projectId: number,
  milestoneId: number,
  body: Partial<{
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    completion_pct: number;
  }>,
): Promise<ConstructionMilestone> {
  const { data } = await api.patch(`/construction/${projectId}/milestones/${milestoneId}`, body);
  return data;
}

export async function deleteMilestone(projectId: number, milestoneId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/milestones/${milestoneId}`);
}

export interface ProjectHealth {
  overall: 'red' | 'amber' | 'green';
  budget_status: 'red' | 'amber' | 'green';
  schedule_status: 'red' | 'amber' | 'green';
  issue_status: 'red' | 'amber' | 'green';
  details: string[];
}

export async function fetchProjectHealth(projectId: number): Promise<ProjectHealth> {
  const { data } = await api.get(`/construction/${projectId}/health`);
  return data;
}
