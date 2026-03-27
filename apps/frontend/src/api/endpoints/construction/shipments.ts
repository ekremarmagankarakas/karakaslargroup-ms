import api from '../../axios';
import type { ConstructionShipment } from '../../../types';

export async function fetchShipments(
  projectId: number,
  params?: { status?: string; material_id?: number },
): Promise<ConstructionShipment[]> {
  const { data } = await api.get(`/construction/${projectId}/shipments`, { params });
  return data;
}

export async function createShipment(
  projectId: number,
  body: {
    material_id?: number;
    material_name: string;
    supplier_name: string;
    quantity_ordered: string;
    unit: string;
    unit_cost?: string;
    total_cost?: string;
    status?: string;
    order_date: string;
    expected_delivery_date?: string;
    notes?: string;
    delivery_note_number?: string;
  },
): Promise<ConstructionShipment> {
  const { data } = await api.post(`/construction/${projectId}/shipments`, body);
  return data;
}

export async function updateShipment(
  projectId: number,
  shipmentId: number,
  body: Partial<{
    material_name: string;
    supplier_name: string;
    quantity_ordered: string;
    quantity_delivered: string;
    unit: string;
    unit_cost: string | null;
    total_cost: string | null;
    status: string;
    order_date: string;
    expected_delivery_date: string | null;
    actual_delivery_date: string | null;
    delivery_note_number: string | null;
    notes: string | null;
    received_by: number | null;
  }>,
): Promise<ConstructionShipment> {
  const { data } = await api.patch(
    `/construction/${projectId}/shipments/${shipmentId}`,
    body,
  );
  return data;
}

export async function deleteShipment(
  projectId: number,
  shipmentId: number,
): Promise<void> {
  await api.delete(`/construction/${projectId}/shipments/${shipmentId}`);
}

export async function fetchPendingShipments(): Promise<ConstructionShipment[]> {
  const { data } = await api.get('/construction/shipments/pending');
  return data;
}

export async function fetchPendingShipmentsCount(): Promise<number> {
  const { data } = await api.get('/construction/shipments/pending/count');
  return data.count;
}
