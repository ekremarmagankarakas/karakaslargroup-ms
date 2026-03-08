import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignUserToLocation,
  createLocation,
  deleteLocation,
  fetchLocations,
  removeUserFromLocation,
  updateLocation,
} from '../api/endpoints/locations';

export function useLocations() {
  return useQuery({ queryKey: ['locations'], queryFn: fetchLocations });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; address?: string | null }) => createLocation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string; address?: string | null } }) =>
      updateLocation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useAssignUserToLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, userId }: { locationId: number; userId: number }) =>
      assignUserToLocation(locationId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useRemoveUserFromLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, userId }: { locationId: number; userId: number }) =>
      removeUserFromLocation(locationId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}
