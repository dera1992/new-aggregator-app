import { apiClient } from './client';
import type { AuthResponse, MessageResponse } from '@/types/user';

const LOGIN_HARD_TIMEOUT_MS = 30000;

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
  // eslint-disable-next-line no-console
  console.log('[auth][api] POST /api/auth/login payload:', { email: payload.email, passwordLength: payload.password.length });
  const request = apiClient.post<AuthResponse>('/api/auth/login', payload);
  const { data } = await withHardTimeout(
    request,
    LOGIN_HARD_TIMEOUT_MS,
    'Login request timed out. If register/forgot-password work but login hangs, check backend logs for /api/auth/login and confirm no proxy/firewall rule is blocking this route.',
  );
  return data;
}

export async function register(payload: { email: string; password: string; name?: string }) {
  // eslint-disable-next-line no-console
  console.log('[auth][api] POST /api/auth/register payload:', { email: payload.email, passwordLength: payload.password.length });
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
