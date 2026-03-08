import api from '../axios';
import type { User, UserDropdownItem, UserRole } from '../../types';

export async function fetchUsers(): Promise<UserDropdownItem[]> {
  const response = await api.get<UserDropdownItem[]>('/users/');
  return response.data;
}

export async function fetchAllUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users/all');
  return response.data;
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<void> {
  await api.post('/users/', data);
}

export async function updateUser(
  userId: number,
  data: { role?: UserRole; email?: string; is_active?: boolean }
): Promise<User> {
  const response = await api.patch<User>(`/users/${userId}`, data);
  return response.data;
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<void> {
  await api.patch('/users/me/password', data);
}
