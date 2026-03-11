import Link from 'next/link';
import {
  BarChart3,
  MessageSquareText,
  Newspaper,
  Share2,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { MarketingPageTemplate } from '@/components/marketing-page-template';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

const trustPoints = [
  'Live source monitoring',
  'AI summaries in seconds',
  'Built for creators and analysts',
  'Fast, modern workflows',
];

const features = [
  {
    title: 'Real-time News Feed',
    description: 'Stay updated with live news from trusted sources worldwide.',
    icon: Newspaper,
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-300',
  },
  {
    title: 'Generate Summaries',
    description: 'Get concise summaries so you can scan stories in seconds.',
    icon: Sparkles,
    iconBg: 'bg-violet-100 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-300',
  },
  {
    title: 'Jokes Generation',
    description: 'Add a touch of fun with AI-generated jokes for breaks.',
    icon: Wand2,
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-300',
  },
  {
    title: 'Viral Post Generation',
    description: 'Create share-ready viral posts crafted from trending topics.',
    icon: Share2,
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-300',
  },
  {
    title: 'Analysis',
    description:
      'Dive deeper with insights and sentiment analysis for stories.',
    icon: BarChart3,
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
  },
  {
    title: 'Comment Generation',
    description: 'Draft thoughtful comments instantly to engage your audience.',
    icon: MessageSquareText,
    iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-300',
  },
];

const quickStats = [
  { label: 'Stories tracked daily', value: '10k+' },
  { label: 'Average summary time', value: '< 15s' },
  { label: 'Content workflows', value: '6-in-1' },
];

const howItWorksSteps = [
  {
    step: '01',
    title: 'We monitor the web',
    description:
      "Dozens of sources scraped every 20 minutes. Breaking stories surface the moment they're published.",
  },
  {
    step: '02',
    title: 'AI clusters & summarizes',
    description:
      'Related articles are grouped into a single story. One summary captures the full picture.',
  },
  {
    step: '03',
    title: 'You publish in seconds',
    description:
      'Generate viral posts, analyses, comments, or jokes — all from one story card.',
  },
];

const personas = [
  {
    title: 'Content Creators',
    description:
      'Turn any trending story into a ready-to-post LinkedIn article, tweet thread, or Instagram caption.',
  },
  {
    title: 'Journalists & Analysts',
    description:
      'Monitor 10+ sources on a single beat. Get bias scores, sentiment, and perspective breakdowns.',
  },
  {
    title: 'Newsletter Writers',
    description:
      'Never run out of material. Curated summaries, drafted comments, and viral hooks — daily.',
  },
];

const composeTools = [
  'Viral Post',
  'LinkedIn Analysis',
  'Comment Reply',
  'Story Joke',
  'Perspective Report',
  'AI Summary',
];

export default function HomePage() {
  return (
    <MarketingPageTemplate navLinks={navLinks} rootId="home">
      {/* Hero */}
      <section className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="text-center lg:text-left">
          <span className="inline-flex rounded-full bg-[#4A90E2]/10 px-4 py-2 text-sm font-medium text-[#4A90E2]">
            Modern news intelligence for busy teams
          </span>
          <h1 className="font-heading mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            Track breaking stories, summarize instantly, publish faster
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            News Aggregator delivers curated real-time coverage, concise
            summaries, and creator-ready tools so your team can move from signal
            to story without friction.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Button
              asChild
              className="bg-[#FF6600] px-8 text-white hover:bg-[#ff7a1a]"
            >
              <Link href="/feed">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
            >
              <Link href="/pricing">See Details</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <p key={point} className="crystal-panel rounded-lg px-3 py-2">
                ✓ {point}
              </p>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="crystal-panel rounded-3xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              Live Story Brief
            </p>
            <h3 className="font-heading mt-3 text-xl font-semibold leading-snug text-slate-900 dark:text-white">
              Global AI regulation enters new phase
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              14 outlets covered new policy updates overnight. Summary generated
              with key impacts, risks, and next-watch signals.
            </p>
            <div className="mt-5 space-y-3">
              <div className="crystal-panel rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
                <p className="font-medium">Summary ready</p>
                <p className="text-xs opacity-80">Generated 12 seconds ago</p>
              </div>
              <div className="crystal-panel rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
                <p className="font-medium">Compose suggestions</p>
                <p className="text-xs opacity-80">1 analysis • 2 post drafts • 3 comments</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="crystal-panel mx-auto grid max-w-6xl gap-4 rounded-2xl p-6 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-semibold text-[#4A90E2]">{stat.value}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section
        id="features"
        className="bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-slate-900"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              Features
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need in one hub
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Streamline news monitoring, content creation, and engagement with
              tools built for modern teams.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="crystal-panel rounded-2xl p-6 text-center transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className={`mx-auto inline-flex rounded-2xl p-3 ${feature.iconBg} ${feature.iconColor}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading mt-4 text-lg font-semibold text-[#333333] dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              How it works
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              From raw feed to ready-to-publish
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {howItWorksSteps.map((item) => (
              <div key={item.step} className="crystal-panel rounded-2xl p-6">
                <p className="text-4xl font-bold text-[#4A90E2]/20">{item.step}</p>
                <h3 className="font-heading mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              Built for
            </p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Whoever needs to stay ahead
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {personas.map((persona) => (
              <div
                key={persona.title}
                className="crystal-panel rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="font-heading text-lg font-semibold text-[#333333] dark:text-white">
                  {persona.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {persona.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compose tools spotlight */}
      <section className="bg-[#1a2744] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
            Compose tools spotlight
          </p>
          <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One headline. Six tools.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-300">
            Pick a story, choose your format, and publish — without ever leaving
            the dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {composeTools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-[#4A90E2]/40 bg-[#4A90E2]/10 px-4 py-2 text-sm font-medium text-[#4A90E2]"
              >
                {tool}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild className="bg-[#FF6600] px-8 text-white hover:bg-[#ff7a1a]">
              <Link href="/register">Try it free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="crystal-panel mx-auto max-w-3xl rounded-2xl p-10 text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to move faster?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Join teams already using News Aggregator to monitor stories, generate
            summaries, and publish without the friction.
          </p>
          <div className="mt-7">
            <Button asChild className="bg-[#FF6600] px-8 text-white hover:bg-[#ff7a1a]">
              <Link href="/register">Register now</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingPageTemplate>
  );
}
