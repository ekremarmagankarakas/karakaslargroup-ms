import api from '../../axios';
import type { ConstructionIssue } from '../../../types';

export async function fetchIssues(projectId: number): Promise<ConstructionIssue[]> {
  const { data } = await api.get(`/construction/${projectId}/issues`);
  return data;
}

export async function createIssue(
  projectId: number,
  body: { title: string; description?: string; severity?: string }
): Promise<ConstructionIssue> {
  const { data } = await api.post(`/construction/${projectId}/issues`, body);
  return data;
}

export async function updateIssue(
  projectId: number,
  issueId: number,
  body: { title?: string; description?: string; severity?: string; status?: string }
): Promise<ConstructionIssue> {
  const { data } = await api.patch(`/construction/${projectId}/issues/${issueId}`, body);
  return data;
}

export async function deleteIssue(projectId: number, issueId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/issues/${issueId}`);
}
