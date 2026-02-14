import { apiClient } from './client';
import type { AuthResponse, MessageResponse } from '@/types/user';

function pickTokenField(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const tokenFields = [candidate.token, candidate.access_token, candidate.authToken];

  for (const field of tokenFields) {
    if (typeof field === 'string' && field.trim().length > 0) {
      return field;
    }
  }

  return null;
}

function extractAuthToken(payload: unknown): string | null {
  return pickTokenField(payload) ??
    pickTokenField((payload as Record<string, unknown> | undefined)?.data) ??
    pickTokenField((payload as Record<string, unknown> | undefined)?.result);
}

const LOGIN_REQUEST_TIMEOUT_MS = 45000;

export async function login(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload, {
    timeout: LOGIN_REQUEST_TIMEOUT_MS,
  });

  const token = extractAuthToken(data);
  if (!token) {
    throw new Error('Login succeeded but no auth token was returned by the API response.');
  }

  return { ...data, token };
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
