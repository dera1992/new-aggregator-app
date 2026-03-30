import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Ubevera. Start free with 30 AI credits per month, or upgrade to Starter for unlimited AI generations.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Ubevera Pricing — Start Free, Upgrade Anytime',
    description: 'Start free with 30 AI credits per month. Upgrade to Starter for unlimited AI-powered news summaries, viral posts, and more.',
    url: '/pricing',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ubevera Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ubevera Pricing — Start Free, Upgrade Anytime',
    description: 'Start free with 30 AI credits per month. Upgrade for unlimited AI generations.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
