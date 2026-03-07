import axios from 'axios';
import type { TokenResponse } from '../../types';

export async function login(username: string, password: string): Promise<TokenResponse> {
  const response = await axios.post<TokenResponse>('/api/auth/login', { username, password });
  return response.data;
}
