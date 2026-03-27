import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteDocument,
  fetchDocuments,
  uploadDocument,
} from '../../api/endpoints/construction/documents';

export function useDocuments(projectId: number | undefined) {
  return useQuery({
    queryKey: ['construction-documents', projectId],
    queryFn: () => fetchDocuments(projectId!),
    enabled: !!projectId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, formData }: { projectId: number; formData: FormData }) =>
      uploadDocument(projectId, formData),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['construction-documents', data.project_id] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, docId }: { projectId: number; docId: number }) =>
      deleteDocument(projectId, docId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-documents', projectId] });
    },
  });
}
