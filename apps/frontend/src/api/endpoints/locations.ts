import api from '../axios';
import type { LocationWithUsers, UserDropdownItem } from '../../types';

export async function fetchLocations(): Promise<LocationWithUsers[]> {
  const { data } = await api.get('/locations/');
  return data;
}

export async function createLocation(payload: { name: string; address?: string | null }): Promise<LocationWithUsers> {
  const { data } = await api.post('/locations/', payload);
  return data;
}

export async function updateLocation(
  id: number,
  payload: { name?: string; address?: string | null },
): Promise<LocationWithUsers> {
  const { data } = await api.patch(`/locations/${id}`, payload);
  return data;
}

export async function deleteLocation(id: number): Promise<void> {
  await api.delete(`/locations/${id}`);
}

export async function assignUserToLocation(locationId: number, userId: number): Promise<void> {
  await api.post(`/locations/${locationId}/users`, { user_id: userId });
}

export async function removeUserFromLocation(locationId: number, userId: number): Promise<void> {
  await api.delete(`/locations/${locationId}/users/${userId}`);
}
