import api from '../axios';
import type { ChatMessage } from '../../types';

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const response = await api.post<{ message: string }>('/chat/', { messages });
  return response.data.message;
}
