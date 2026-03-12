import api from '../../axios';
import type { ConstructionComment } from '../../../types';

export async function fetchComments(projectId: number): Promise<ConstructionComment[]> {
  const { data } = await api.get(`/construction/${projectId}/comments`);
  return data;
}

export async function createComment(
  projectId: number,
  body: { content: string }
): Promise<ConstructionComment> {
  const { data } = await api.post(`/construction/${projectId}/comments`, body);
  return data;
}

export async function deleteComment(projectId: number, commentId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/comments/${commentId}`);
}
