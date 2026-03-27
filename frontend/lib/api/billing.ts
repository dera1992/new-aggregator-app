import { apiFetch } from '@/lib/api/client';

export type Plan = 'starter';

export type CreditsInfo = {
  ai_credits_balance: number;
  ai_credits_reset_at: string | null;
  plan: string;
  subscription_status: string;
};

export type Payment = {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoice_url: string | null;
  invoice_pdf: string | null;
};

export function createCheckoutSession(plan: Plan): Promise<{ url: string }> {
  return apiFetch('/api/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export function createPortalSession(): Promise<{ url: string }> {
  return apiFetch('/api/billing/portal', { method: 'POST' });
}

export function fetchCredits(): Promise<CreditsInfo> {
  return apiFetch('/api/user/credits');
}

export function fetchPaymentHistory(): Promise<{ payments: Payment[] }> {
  return apiFetch('/api/billing/payment-history');
}
