import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createComment,
  deleteComment,
  fetchComments,
} from '../../api/endpoints/construction/comments';

export function useComments(projectId: number) {
  return useQuery({
    queryKey: ['construction-comments', projectId],
    queryFn: () => fetchComments(projectId),
    enabled: !!projectId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createComment>[1];
    }) => createComment(projectId, body),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-comments', projectId] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, commentId }: { projectId: number; commentId: number }) =>
      deleteComment(projectId, commentId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-comments', projectId] });
    },
  });
}
