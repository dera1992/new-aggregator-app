import { apiClient } from './client';
import type { AuthResponse, MessageResponse } from '@/types/user';

export async function login(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function register(payload: { email: string; password: string; name?: string }) {
  const { data } = await apiClient.post<MessageResponse>('/api/auth/register', payload);
  return data;
}

export async function confirmEmail(payload: { email: string; token: string }) {
  const { data } = await apiClient.post<MessageResponse>('/api/auth/confirm', payload);
  return data;
}

export async function resendConfirmation(payload: { email: string }) {
  const { data } = await apiClient.post<MessageResponse>('/api/auth/resend-confirmation', payload);
  return data;
}

export async function forgotPassword(payload: { email: string }) {
  const { data } = await apiClient.post<MessageResponse>('/api/auth/forgot-password', payload);
  return data;
}

export async function resetPassword(payload: { email: string; token: string; new_password: string }) {
  const { data } = await apiClient.post<MessageResponse>('/api/auth/reset-password', payload);
  return data;
}

export async function changePassword(payload: { current_password: string; new_password: string }) {
  const { data } = await apiClient.post<MessageResponse>('/api/auth/change-password', payload);
  return data;
}
