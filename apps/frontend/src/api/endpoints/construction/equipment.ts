import api from '../../axios';
import type { ConstructionEquipment, EquipmentCreate, EquipmentUpdate } from '../../../types';

export async function fetchEquipment(projectId: number): Promise<ConstructionEquipment[]> {
  const { data } = await api.get(`/construction/${projectId}/equipment`);
  return data;
}

export async function createEquipment(projectId: number, body: EquipmentCreate): Promise<ConstructionEquipment> {
  const { data } = await api.post(`/construction/${projectId}/equipment`, body);
  return data;
}

export async function updateEquipment(projectId: number, equipmentId: number, body: EquipmentUpdate): Promise<ConstructionEquipment> {
  const { data } = await api.patch(`/construction/${projectId}/equipment/${equipmentId}`, body);
  return data;
}

export async function deleteEquipment(projectId: number, equipmentId: number): Promise<void> {
  await api.delete(`/construction/${projectId}/equipment/${equipmentId}`);
}
