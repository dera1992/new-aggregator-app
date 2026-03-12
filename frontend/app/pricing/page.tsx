'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { MarketingPageTemplate } from '@/components/marketing-page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCheckoutSession, type Plan } from '@/lib/api/billing';
import { getToken } from '@/lib/auth/token';

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  plan: Plan | null; // null = free tier
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About' },
];

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'For individuals exploring the platform.',
    features: ['Daily feed updates', 'Basic compose tools', '10 AI credits/month'],
    plan: null,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For creators and small teams publishing frequently.',
    features: [
      'Unlimited AI generations',
      'Priority article + YouTube URL imports',
      'Advanced analysis and viral tools',
    ],
    highlighted: true,
    plan: 'pro',
  },
  {
    name: 'Business',
    price: '$99',
    period: '/month',
    description: 'For teams managing multi-channel news operations.',
    features: ['Everything in Pro', 'Team workspaces', 'Shared prompt defaults', 'Premium support'],
    plan: 'business',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  const handlePlanClick = async (plan: Plan | null) => {
    if (!plan) {
      router.push('/register');
      return;
    }
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setLoadingPlan(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoadingPlan(null);
    }
  };

  return (
    <MarketingPageTemplate navLinks={navLinks}>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Simple pricing for every stage
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Pick a plan that matches your workflow. Upgrade any time as your
            publishing needs grow.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-[#4A90E2] shadow-md' : ''}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#4A90E2]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={
                    plan.highlighted
                      ? 'w-full bg-[#4A90E2] text-white hover:bg-[#357abd]'
                      : 'w-full'
                  }
                  variant={plan.highlighted ? 'default' : 'outline'}
                  disabled={loadingPlan !== null}
                  onClick={() => handlePlanClick(plan.plan)}
                >
                  {loadingPlan === plan.plan ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : plan.plan ? (
                    <Zap className="mr-2 h-4 w-4" />
                  ) : null}
                  {plan.plan ? `Get ${plan.name}` : 'Get started free'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-[#4A90E2] hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </MarketingPageTemplate>
  );
}
