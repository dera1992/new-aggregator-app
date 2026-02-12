import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'For individuals exploring the platform.',
    features: ['Daily feed updates', 'Basic compose tools', '5 saved drafts'],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For creators and small teams publishing frequently.',
    features: [
      'Unlimited compose generations',
      'Priority article + YouTube URL imports',
      'Advanced analysis and viral tools',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$99',
    period: '/month',
    description: 'For teams managing multi-channel news operations.',
    features: ['Team workspaces', 'Shared prompt defaults', 'Premium support'],
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]">
          <Link href="/register">Start Free Trial</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
