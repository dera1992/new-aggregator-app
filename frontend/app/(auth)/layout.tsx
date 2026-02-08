import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted p-6">
      <Link
        className="absolute left-4 top-4 text-sm font-medium text-primary transition hover:text-primary/90"
        href="/"
      >
        ← Back to home
      </Link>
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
