import api from '../axios';
import type { Notification } from '../../types';

export async function fetchNotifications(): Promise<Notification[]> {
  const response = await api.get<Notification[]>('/notifications/');
  return response.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await api.get<{ count: number }>('/notifications/unread-count');
  return response.data.count;
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
