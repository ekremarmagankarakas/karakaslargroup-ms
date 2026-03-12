import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePhoto, fetchPhotos, uploadPhoto } from '../../api/endpoints/construction/photos';

export function usePhotos(projectId: number) {
  return useQuery({
    queryKey: ['construction-photos', projectId],
    queryFn: () => fetchPhotos(projectId),
    enabled: !!projectId,
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, formData }: { projectId: number; formData: FormData }) =>
      uploadPhoto(projectId, formData),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-photos', projectId] });
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, photoId }: { projectId: number; photoId: number }) =>
      deletePhoto(projectId, photoId),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-photos', projectId] });
    },
  });
}
