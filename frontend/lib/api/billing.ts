import { apiFetch } from '@/lib/api/client';

export type Plan = 'pro' | 'business';

export function createCheckoutSession(plan: Plan): Promise<{ url: string }> {
  return apiFetch('/api/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export function createPortalSession(): Promise<{ url: string }> {
  return apiFetch('/api/billing/portal', {
    method: 'POST',
  });
}
