import api from '../../axios';
import type { BudgetLineCreate, BudgetLineUpdate, BudgetSummaryResponse, ConstructionBudgetLine } from '../../../types';

export async function fetchBudget(projectId: number): Promise<BudgetSummaryResponse> {
  const { data } = await api.get(`/construction/${projectId}/budget`);
  return data;
}

export async function createBudgetLine(
  projectId: number,
  body: BudgetLineCreate,
): Promise<ConstructionBudgetLine> {
  const { data } = await api.post(`/construction/${projectId}/budget/lines`, body);
  return data;
}

export async function updateBudgetLine(
  projectId: number,
  lineId: number,
  body: BudgetLineUpdate,
): Promise<ConstructionBudgetLine> {
  const { data } = await api.patch(`/construction/${projectId}/budget/lines/${lineId}`, body);
  return data;
}

export async function deleteBudgetLine(projectId: number, lineId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/budget/lines/${lineId}`);
}
