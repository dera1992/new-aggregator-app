import { apiFetch } from '@/lib/api/client';
import type { AuthMessageResponse, AuthTokenResponse } from '@/types/auth';

export function register(email: string, password: string) {
  return apiFetch<AuthMessageResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function confirmAccount(email: string, token: string) {
  return apiFetch<AuthMessageResponse>('/api/auth/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, token }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthTokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function resendConfirmation(email: string) {
  return apiFetch<AuthMessageResponse>('/api/auth/resend-confirmation', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email: string) {
  return apiFetch<AuthMessageResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email: string, token: string, newPassword: string) {
  return apiFetch<AuthMessageResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, new_password: newPassword }),
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<AuthMessageResponse>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

let _refreshTokenPromise: Promise<AuthTokenResponse> | null = null;

export function refreshAccessToken(): Promise<AuthTokenResponse> {
  if (_refreshTokenPromise) return _refreshTokenPromise;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  _refreshTokenPromise = fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      return res.json() as Promise<AuthTokenResponse>;
    })
    .finally(() => {
      _refreshTokenPromise = null;
    });
  return _refreshTokenPromise;
}

export function logoutApi(): Promise<void> {
  return apiFetch('/api/auth/logout', { method: 'POST' }).then(() => undefined).catch(() => undefined);
}
