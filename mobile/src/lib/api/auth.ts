import { apiClient } from './client';
import type { AuthResponse, MessageResponse } from '@/types/user';

function extractAuthToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const tokenFields = [candidate.token, candidate.access_token, candidate.authToken];

  for (const field of tokenFields) {
    if (typeof field === 'string' && field.trim().length > 0) {
      return field;
    }
  }

  return null;
}

const LOGIN_HARD_TIMEOUT_MS = 80000;

async function withHardTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function login(payload: { email: string; password: string }) {
  const request = apiClient.post<AuthResponse>('/api/auth/login', payload);
  const { data } = await withHardTimeout(
    request,
    LOGIN_HARD_TIMEOUT_MS,
    'Login request to /api/auth/login timed out.',
  );

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
