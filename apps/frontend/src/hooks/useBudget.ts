import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBudgetStatus, setBudget } from '../api/endpoints/budget';

export function useBudgetStatus(month?: number, year?: number) {
  return useQuery({
    queryKey: ['budget', month, year],
    queryFn: () => fetchBudgetStatus(month, year),
  });
}

export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: string; period_month: number; period_year: number }) =>
      setBudget(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}
