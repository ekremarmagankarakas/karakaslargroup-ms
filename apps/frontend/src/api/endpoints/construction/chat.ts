import api from '../../axios';
import type { ChatMessage } from '../../../types';

export async function sendConstructionChat(messages: ChatMessage[]): Promise<string> {
  const { data } = await api.post('/construction/chat', { messages });
  return data.message;
}
