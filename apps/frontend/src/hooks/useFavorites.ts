import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addFavorite, fetchFavorites, removeFavorite } from '../api/endpoints/favorites';

export function useFavorites(page: number) {
  return useQuery({
    queryKey: ['favorites', page],
    queryFn: () => fetchFavorites(page),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requirementId, isFavorited }: { requirementId: number; isFavorited: boolean }) => {
      if (isFavorited) {
        await removeFavorite(requirementId);
      } else {
        await addFavorite(requirementId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
}
