import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createShipment,
  deleteShipment,
  fetchPendingShipmentsCount,
  fetchShipments,
  updateShipment,
} from '../../api/endpoints/construction/shipments';

export function useShipments(
  projectId: number | undefined,
  params?: { status?: string; material_id?: number },
) {
  return useQuery({
    queryKey: ['construction-shipments', projectId, params],
    queryFn: () => fetchShipments(projectId!, params),
    enabled: projectId !== undefined,
  });
}

export function usePendingShipmentsCount() {
  return useQuery({
    queryKey: ['construction-shipments-pending-count'],
    queryFn: fetchPendingShipmentsCount,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: number;
      body: Parameters<typeof createShipment>[1];
    }) => createShipment(projectId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-shipments', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-shipments-pending-count'] });
    },
  });
}

export function useUpdateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      shipmentId,
      body,
    }: {
      projectId: number;
      shipmentId: number;
      body: Parameters<typeof updateShipment>[2];
    }) => updateShipment(projectId, shipmentId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-shipments', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-shipments-pending-count'] });
      qc.invalidateQueries({ queryKey: ['construction-materials', projectId] });
    },
  });
}

export function useDeleteShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, shipmentId }: { projectId: number; shipmentId: number }) =>
      deleteShipment(projectId, shipmentId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['construction-shipments', projectId] });
      qc.invalidateQueries({ queryKey: ['construction-shipments-pending-count'] });
    },
  });
}
