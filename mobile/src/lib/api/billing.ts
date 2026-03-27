import { apiClient } from './client';

export type Plan = 'starter';

export async function createCheckoutSession(plan: Plan): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ url: string }>(
    '/api/billing/create-checkout-session',
    { plan },
  );
  return data;
}

export async function createPortalSession(): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ url: string }>('/api/billing/portal');
  return data;
}
