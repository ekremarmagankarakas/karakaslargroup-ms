import axios from 'axios';
import type { TokenResponse } from '../../types';

export async function login(username: string, password: string): Promise<TokenResponse> {
  const response = await axios.post<TokenResponse>('/api/auth/login', { username, password });
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await axios.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  await axios.post('/api/auth/reset-password', { token, new_password });
}
