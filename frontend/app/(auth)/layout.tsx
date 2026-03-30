import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign in to Ubevera',
  description: 'Sign in or create an account to access real-time news intelligence, AI summaries, and content generation tools.',
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-transparent p-6">
      <Link
        className="absolute left-4 top-4 text-sm font-medium text-primary transition hover:text-primary/90"
        href="/"
      >
        ← Back to home
      </Link>
      <div className="w-full max-w-md rounded-lg border border-border bg-background/85 p-6 shadow-sm backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
