'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">You're subscribed!</h1>
        <p className="text-muted-foreground max-w-sm">
          Your payment was successful. Your plan has been activated — enjoy unlimited AI generations.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/feed">Go to Feed</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings">View Settings</Link>
        </Button>
      </div>
    </div>
  );
}
