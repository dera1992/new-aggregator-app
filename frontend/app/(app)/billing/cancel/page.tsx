'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <XCircle className="h-16 w-16 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Checkout cancelled</h1>
        <p className="text-muted-foreground max-w-sm">
          No charge was made. You can upgrade any time from your settings.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/settings">Back to Settings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/pricing">View Pricing</Link>
        </Button>
      </div>
    </div>
  );
}
