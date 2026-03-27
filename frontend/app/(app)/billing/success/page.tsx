'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { syncCheckout, syncSubscription } from '@/lib/api/billing';

export default function BillingSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function activate() {
      const sessionId = params.get('session_id');
      let synced = false;

      // Try the precise checkout sync first
      if (sessionId) {
        try {
          const result = await syncCheckout(sessionId);
          synced = result.synced === true;
        } catch {
          // fall through to subscription sync
        }
      }

      // Fall back to listing all active subscriptions for this customer
      if (!synced) {
        try {
          const result = await syncSubscription();
          synced = result.synced === true && result.tier !== 'free';
        } catch {
          // ignore — webhook will eventually sync
        }
      }

      // Refresh cached data so settings page shows the new plan immediately
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['credits'] });

      if (synced) {
        toast.success('Subscription activated!');
      } else {
        toast.info('Payment received — your plan will activate shortly.');
      }

      router.replace('/billing');
    }

    activate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Activating your subscription…</p>
    </div>
  );
}
