import Link from 'next/link';
import { Eye, Lightbulb, Shield } from 'lucide-react';

import { MarketingPageTemplate } from '@/components/marketing-page-template';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

const values = [
  {
    title: 'Speed without noise',
    description:
      'Cut through the volume. Surface what matters, summarize it instantly.',
    icon: Eye,
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-300',
  },
  {
    title: 'Creator-first design',
    description:
      'Every feature is built around one question: can you publish from this?',
    icon: Lightbulb,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-300',
  },
  {
    title: 'Transparency in AI',
    description:
      'Bias scores, sentiment, and source counts are always visible.',
    icon: Shield,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
  },
];

export default function AboutPage() {
  return (
    <MarketingPageTemplate navLinks={navLinks}>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <span className="inline-flex rounded-full bg-[#4A90E2]/10 px-4 py-2 text-sm font-medium text-[#4A90E2]">
          About us
        </span>
        <h1 className="font-heading mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          Built for people who can&apos;t afford to miss a story
        </h1>
        <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          We built News Aggregator to help journalists, creators, and analysts
          stay ahead — without spending hours manually checking dozens of tabs,
          feeds, and newsletters.
        </p>
      </section>

      {/* Mission */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl">
          <div className="crystal-panel rounded-2xl p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              Our mission
            </p>
            <h2 className="font-heading mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              One platform. Every story. Zero friction.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              The platform automatically monitors hundreds of sources around the
              clock. When related articles appear across different outlets, our
              AI groups them into a single story cluster — so you never see the
              same news five times under different headlines.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              From that cluster, you get an instant AI summary, a sentiment
              breakdown, and a full suite of compose tools: viral posts, LinkedIn
              analyses, comment replies, jokes, and more. The goal is simple —
              from raw signal to published content, as fast as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              What we stand for
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Our values
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="crystal-panel rounded-2xl p-6 text-center transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className={`mx-auto inline-flex rounded-2xl p-3 ${value.iconBg} ${value.iconColor}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading mt-4 text-lg font-semibold text-[#333333] dark:text-white">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Where this came from */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl">
          <div className="crystal-panel rounded-2xl p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              Where this came from
            </p>
            <h2 className="font-heading mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Built out of frustration with the status quo
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              We were tracking too many sources manually — RSS feeds, Google
              Alerts, Twitter lists, newsletters — just to stay current on a
              single beat. The aggregation was a full-time job before the actual
              work even started. So we built the thing we needed: a platform that
              does the monitoring, clustering, and summarizing automatically, and
              then gets out of the way so you can write and publish.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              What started as an internal tool is now available to any team that
              runs on news — and needs to move faster than the next person
              covering the same story.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="crystal-panel mx-auto max-w-3xl rounded-2xl p-10 text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Start using it free
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            No credit card required. Get full access to the feed, AI summaries,
            and compose tools from day one.
          </p>
          <div className="mt-7">
            <Button asChild className="bg-[#FF6600] px-8 text-white hover:bg-[#ff7a1a]">
              <Link href="/register">Create your free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingPageTemplate>
  );
}
