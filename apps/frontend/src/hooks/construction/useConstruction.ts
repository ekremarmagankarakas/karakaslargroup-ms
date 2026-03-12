import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMaterial,
  createMilestone,
  createProject,
  deleteMaterial,
  deleteMilestone,
  deleteProject,
  fetchMaterials,
  fetchMilestones,
  fetchProject,
  fetchProjects,
  updateMaterial,
  updateMilestone,
  updateProject,
} from '../../api/endpoints/construction/projects';
import type { ConstructionProjectFilters } from '../../types';

// ── Projects ──────────────────────────────────────────────────────────────────

export function useProjects(filters: ConstructionProjectFilters) {
  return useQuery({
    queryKey: ['construction-projects', filters],
    queryFn: () => fetchProjects(filters),
  });
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: ['construction-project', id],
    queryFn: () => fetchProject(id!),
    enabled: id !== undefined,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction-projects'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateProject>[1] }) =>
      updateProject(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['construction-projects'] });
      qc.invalidateQueries({ queryKey: ['construction-project', id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction-projects'] });
    },
  });
}

// ── Materials ─────────────────────────────────────────────────────────────────

export function useMaterials(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-materials', projectId],
    queryFn: () => fetchMaterials(projectId!),
    enabled: projectId !== undefined,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createMaterial>[1];
    }) => createMaterial(projectId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-materials', projectId] });
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      materialId,
      body,
    }: {
      projectId: number;
      materialId: number;
      body: Parameters<typeof updateMaterial>[2];
    }) => updateMaterial(projectId, materialId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-materials', projectId] });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, materialId }: { projectId: number; materialId: number }) =>
      deleteMaterial(projectId, materialId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-materials', projectId] });
    },
  });
}

// ── Milestones ────────────────────────────────────────────────────────────────

export function useMilestones(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-milestones', projectId],
    queryFn: () => fetchMilestones(projectId!),
    enabled: projectId !== undefined,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createMilestone>[1];
    }) => createMilestone(projectId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-milestones', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-project', projectId] });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      milestoneId,
      body,
    }: {
      projectId: number;
      milestoneId: number;
      body: Parameters<typeof updateMilestone>[2];
    }) => updateMilestone(projectId, milestoneId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-milestones', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-project', projectId] });
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, milestoneId }: { projectId: number; milestoneId: number }) =>
      deleteMilestone(projectId, milestoneId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-milestones', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-project', projectId] });
    },
  });
}
