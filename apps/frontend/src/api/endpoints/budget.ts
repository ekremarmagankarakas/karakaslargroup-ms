import api from '../axios';
import type { BudgetHistoryResponse, BudgetStatus } from '../../types';

export async function fetchBudgetStatus(month?: number, year?: number, locationId?: number): Promise<BudgetStatus> {
  const response = await api.get<BudgetStatus>('/budget/', { params: { month, year, location_id: locationId } });
  return response.data;
}

export async function setBudget(data: {
  amount: string;
  period_month: number;
  period_year: number;
  location_id?: number;
}): Promise<void> {
  await api.post('/budget/', data);
}

export async function fetchBudgetHistory(months = 12, locationId?: number): Promise<BudgetHistoryResponse> {
  const response = await api.get<BudgetHistoryResponse>('/budget/history', {
    params: { months, location_id: locationId },
  });
  return response.data;
}
