import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEquipment, createEquipment, updateEquipment, deleteEquipment } from '../../api/endpoints/construction/equipment';
import type { EquipmentCreate, EquipmentUpdate } from '../../types';

export function useEquipment(projectId: number) {
  return useQuery({
    queryKey: ['construction-equipment', projectId],
    queryFn: () => fetchEquipment(projectId),
  });
}

export function useCreateEquipment(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EquipmentCreate) => createEquipment(projectId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-equipment', projectId] }),
  });
}

export function useUpdateEquipment(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, body }: { equipmentId: number; body: EquipmentUpdate }) =>
      updateEquipment(projectId, equipmentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-equipment', projectId] }),
  });
}

export function useDeleteEquipment(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: number) => deleteEquipment(projectId, equipmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction-equipment', projectId] }),
  });
}
