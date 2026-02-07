'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { clearToken, getToken } from '@/lib/auth/token';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
];

const features = [
  {
    title: 'Real-time News Feed',
    description: 'Stay updated with live news from trusted sources worldwide.',
  },
  {
    title: 'Generate Summaries',
    description: 'Get concise summaries so you can scan stories in seconds.',
  },
  {
    title: 'Jokes Generation',
    description: 'Add a touch of fun with AI-generated jokes for breaks.',
  },
  {
    title: 'Viral Post Generation',
    description: 'Create share-ready viral posts crafted from trending topics.',
  },
  {
    title: 'Analysis',
    description: 'Dive deeper with insights and sentiment analysis for stories.',
  },
  {
    title: 'Comment Generation',
    description: 'Draft thoughtful comments instantly to engage your audience.',
  },
];

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(getToken()));
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
  };

  return (
    <div
      id="home"
      className="min-h-screen bg-[#F5F5F5] text-[#333333] dark:bg-slate-950 dark:text-slate-100"
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-[#4A90E2]"
          >
            News Aggregator
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#333333] md:flex dark:text-slate-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[#4A90E2]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white/80 p-2 text-slate-700 shadow-sm transition hover:bg-white md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white/95 px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#333333] transition-colors hover:text-[#4A90E2] dark:text-slate-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]"
                    >
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-24">
        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col items-center justify-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <span className="rounded-full bg-[#4A90E2]/10 px-4 py-2 text-sm font-medium text-[#4A90E2]">
            Modern news intelligence for busy teams
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Stay Updated with the Info from Around the World
          </h1>
          <p className="max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            News Aggregator delivers curated, real-time stories with summaries,
            insights, and content tools to keep your audience engaged.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="bg-[#FF6600] px-8 text-white hover:bg-[#ff7a1a]">
              <Link href="/feed">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
            >
              <Link href="#features">View Features</Link>
            </Button>
          </div>
        </section>

        <section
          id="features"
          className="bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-slate-900"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-semibold">Everything you need in one hub</h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Streamline news monitoring, content creation, and engagement with tools
                built for modern teams.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-[#F5F5F5] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Flexible plans for every team</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              Choose a plan that scales with your newsroom. Start free and upgrade when
              you are ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]">
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
              >
                <Link href="/pricing">See Details</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-slate-900"
        >
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4A90E2]">
              About
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Built for fast-moving newsrooms</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              We help journalists, analysts, and creators monitor global stories,
              summarize key developments, and generate content that keeps audiences
              informed.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        © 2026 News Aggregator. All rights reserved.
      </footer>
    </div>
  );
}
