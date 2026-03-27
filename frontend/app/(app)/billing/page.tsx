'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, Loader2, Receipt, Zap } from 'lucide-react';

import { fetchProfile } from '@/lib/api/profile';
import {
  cancelSubscription,
  resumeSubscription,
  createCheckoutSession,
  createPortalSession,
  fetchCredits,
  fetchPaymentHistory,
  syncSubscription,
  type CreditsInfo,
  type Payment,
} from '@/lib/api/billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function BillingPage() {
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    refetchOnMount: 'always',
  });

  const { data: creditsInfo, refetch: refetchCredits } = useQuery<CreditsInfo>({
    queryKey: ['credits'],
    queryFn: fetchCredits,
    refetchOnMount: 'always',
  });

  const { data: paymentData } = useQuery<{ payments: Payment[] }>({
    queryKey: ['payment-history'],
    queryFn: fetchPaymentHistory,
    refetchOnMount: 'always',
  });

  // Auto-sync when paid invoices exist but plan isn't active
  useEffect(() => {
    if (
      profile &&
      paymentData &&
      paymentData.payments.some((p) => p.status === 'paid') &&
      profile.subscription_status !== 'active'
    ) {
      syncSubscription()
        .then((result) => {
          if (result.synced && result.tier && result.tier !== 'free') {
            refetchProfile();
            refetchCredits();
          }
        })
        .catch(() => {});
    }
  }, [profile, paymentData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpgrade = async (plan: 'starter') => {
    setIsBillingLoading(true);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
      setIsBillingLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsResuming(true);
    try {
      await resumeSubscription();
      toast.success('Auto-renewal re-enabled. Your subscription will renew as normal.');
      refetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setIsResuming(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled. You keep access until the end of your billing period.');
      setShowCancelConfirm(false);
      refetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription plan */}
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!profile ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : profile.subscription_status === 'active' || profile.subscription_status === 'canceling' ? (
            <>
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Current plan</p>
                    <p className="text-lg font-semibold capitalize mt-0.5">
                      {profile.subscription_tier === 'starter' ? 'Starter — $15/mo' : profile.subscription_tier}
                    </p>
                  </div>
                  {profile.subscription_status === 'canceling' ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      Cancels soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      Active
                    </span>
                  )}
                </div>
                {profile.subscription_expires_at && (
                  <p className="text-sm text-muted-foreground">
                    {profile.subscription_status === 'canceling' ? 'Access until ' : 'Renews on '}
                    <span className="font-medium text-foreground">
                      {new Date(profile.subscription_expires_at).toLocaleDateString(undefined, {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={isBillingLoading || isCanceling || isResuming}
                >
                  {isBillingLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Manage subscription
                </Button>

                {profile.subscription_status === 'canceling' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeSubscription}
                    disabled={isResuming || isBillingLoading}
                  >
                    {isResuming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resume subscription
                  </Button>
                )}

                {profile.subscription_status === 'active' && !showCancelConfirm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isBillingLoading}
                  >
                    Turn off auto-renewal
                  </Button>
                )}
              </div>

              {showCancelConfirm && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium">Turn off auto-renewal?</p>
                  <p className="text-sm text-muted-foreground">
                    You'll keep full access until{' '}
                    {profile.subscription_expires_at
                      ? new Date(profile.subscription_expires_at).toLocaleDateString(undefined, {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })
                      : 'the end of your billing period'}
                    . After that your account moves to the Free plan.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                    >
                      {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Yes, turn off auto-renewal
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={isCanceling}
                    >
                      Keep plan
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current plan</p>
                <p className="text-lg font-semibold">Free</p>
                <p className="text-sm text-muted-foreground">10 AI credits per month</p>
              </div>
              {profile.subscription_status === 'past_due' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Your payment is past due. Please update your payment method.
                </p>
              )}
              <Button
                size="sm"
                className="bg-[#4A90E2] text-white hover:bg-[#357abd]"
                onClick={() => handleUpgrade('starter')}
                disabled={isBillingLoading}
              >
                {isBillingLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Upgrade to Starter — $15/mo
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Credits — free users only */}
      {creditsInfo && creditsInfo.plan === 'free' && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle>AI Credits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="text-xl font-semibold tabular-nums">
                {creditsInfo.ai_credits_balance}
                <span className="text-sm font-normal text-muted-foreground"> / 10</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#4A90E2] transition-all"
                style={{ width: `${(creditsInfo.ai_credits_balance / 10) * 100}%` }}
              />
            </div>
            {creditsInfo.ai_credits_reset_at && (
              <p className="text-xs text-muted-foreground">
                Resets on{' '}
                {new Date(creditsInfo.ai_credits_reset_at).toLocaleDateString(undefined, {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Upgrade to Starter for unlimited AI generations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {paymentData && paymentData.payments.length > 0 && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border text-sm">
              {paymentData.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{p.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.date * 1000).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={
                        p.status === 'paid'
                          ? 'text-green-600 dark:text-green-400 font-medium'
                          : p.status === 'open'
                            ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                            : 'text-muted-foreground'
                      }
                    >
                      {p.currency} {p.amount.toFixed(2)}
                    </span>
                    {p.invoice_url && (
                      <a
                        href={p.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#4A90E2] hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
