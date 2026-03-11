'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { clearToken, getToken } from '@/lib/auth/token';

type NavLink = {
  href: string;
  label: string;
};

type MarketingPageTemplateProps = {
  children: React.ReactNode;
  navLinks: NavLink[];
  rootId?: string;
};

export function MarketingPageTemplate({
  children,
  navLinks,
  rootId,
}: MarketingPageTemplateProps) {
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
      id={rootId}
      className="relative min-h-screen overflow-hidden bg-[#F5F5F5] text-[#333333] dark:bg-slate-950 dark:text-slate-100"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#4A90E2]/15 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-[#FF6600]/10 blur-3xl dark:bg-orange-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,144,226,0.08),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
      </div>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight text-[#4A90E2]"
          >
            News Aggregator
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium tracking-wide text-[#333333] md:flex dark:text-slate-100">
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
              <div className="flex items-center gap-2">
                <Button asChild className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]">
                  <Link href="/compose">Get Started</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]">
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
                  <div className="flex items-center gap-2">
                    <Button asChild className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]">
                      <Link href="/compose">Get Started</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="text-[#4A90E2] hover:bg-[#4A90E2]/10"
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="bg-[#FF6600] text-white hover:bg-[#ff7a1a]">
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-24">{children}</main>

      <footer className="border-t border-slate-100 bg-[#0d1424] px-4 py-12 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-heading text-base font-semibold text-white">
                News Aggregator
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Real-time news intelligence for creators, journalists, and
                analysts.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Platform
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400 leading-relaxed">
                <li>
                  <Link href="/feed" className="text-slate-400 transition-colors hover:text-white">News Feed</Link>
                </li>
                <li>
                  <Link href="/compose" className="text-slate-400 transition-colors hover:text-white">Compose</Link>
                </li>
                <li>
                  <Link href="/preferences" className="text-slate-400 transition-colors hover:text-white">Preferences</Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Quick Links
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400 leading-relaxed">
                <li>
                  <Link href="/about" className="text-slate-400 transition-colors hover:text-white">About</Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-slate-400 transition-colors hover:text-white">Pricing</Link>
                </li>

              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Legal
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400 leading-relaxed">
                <li>
                  <Link href="/privacy" className="text-slate-400 transition-colors hover:text-white">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 transition-colors hover:text-white">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-slate-400 transition-colors hover:text-white">Cookie Policy</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            © 2026 News Aggregator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
