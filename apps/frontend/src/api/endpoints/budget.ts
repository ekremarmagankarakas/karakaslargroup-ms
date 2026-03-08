import api from '../axios';
import type { BudgetStatus } from '../../types';

export async function fetchBudgetStatus(month?: number, year?: number): Promise<BudgetStatus> {
  const response = await api.get<BudgetStatus>('/budget/', { params: { month, year } });
  return response.data;
}

export async function setBudget(data: {
  amount: string;
  period_month: number;
  period_year: number;
}): Promise<void> {
  await api.post('/budget/', data);
}
