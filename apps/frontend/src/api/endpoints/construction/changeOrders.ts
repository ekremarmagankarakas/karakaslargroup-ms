import api from '../../axios';
import type { ConstructionChangeOrder } from '../../../types';

export async function fetchChangeOrders(projectId: number): Promise<ConstructionChangeOrder[]> {
  const { data } = await api.get(`/construction/${projectId}/change-orders`);
  return data;
}

export async function createChangeOrder(
  projectId: number,
  body: {
    title: string;
    description: string;
    cost_delta?: string;
    schedule_delta_days?: number | null;
  }
): Promise<ConstructionChangeOrder> {
  const { data } = await api.post(`/construction/${projectId}/change-orders`, body);
  return data;
}

export async function submitChangeOrder(
  projectId: number,
  coId: number
): Promise<ConstructionChangeOrder> {
  const { data } = await api.post(`/construction/${projectId}/change-orders/${coId}/submit`, {});
  return data;
}

export async function approveChangeOrder(
  projectId: number,
  coId: number
): Promise<ConstructionChangeOrder> {
  const { data } = await api.post(`/construction/${projectId}/change-orders/${coId}/approve`, {});
  return data;
}

export async function rejectChangeOrder(
  projectId: number,
  coId: number
): Promise<ConstructionChangeOrder> {
  const { data } = await api.post(`/construction/${projectId}/change-orders/${coId}/reject`, {});
  return data;
}

export async function deleteChangeOrder(projectId: number, coId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/change-orders/${coId}`);
}
