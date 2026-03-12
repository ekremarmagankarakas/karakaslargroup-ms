import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFavoriteProjects, toggleProjectFavorite } from '../../api/endpoints/construction/favorites';

export function useFavoriteProjects() {
  return useQuery({
    queryKey: ['construction-favorites'],
    queryFn: fetchFavoriteProjects,
  });
}

export function useToggleProjectFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => toggleProjectFavorite(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction-favorites'] });
      qc.invalidateQueries({ queryKey: ['construction-projects'] });
      qc.invalidateQueries({ queryKey: ['construction-project'] });
    },
  });
}
