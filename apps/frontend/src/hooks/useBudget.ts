import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBudgetHistory, fetchBudgetStatus, setBudget } from '../api/endpoints/budget';

export function useBudgetStatus(month?: number, year?: number, locationId?: number) {
  return useQuery({
    queryKey: ['budget', 'status', month, year, locationId],
    queryFn: () => fetchBudgetStatus(month, year, locationId),
  });
}

export function useBudgetHistory(months = 12, locationId?: number) {
  return useQuery({
    queryKey: ['budget', 'history', months, locationId],
    queryFn: () => fetchBudgetHistory(months, locationId),
  });
}

export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: string; period_month: number; period_year: number; location_id?: number }) =>
      setBudget(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}
