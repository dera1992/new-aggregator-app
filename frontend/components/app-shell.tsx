'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Newspaper,
  Archive,
  Bookmark,
  CheckCircle2,
  Settings,
  SlidersHorizontal,
  PenSquare,
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clearToken } from '@/lib/auth/token';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/read', label: 'Read', icon: CheckCircle2 },
  { href: '/compose', label: 'Compose', icon: PenSquare },
  { href: '/preferences', label: 'Preferences', icon: SlidersHorizontal },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: Shield },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-border bg-background p-6 md:flex">
          <div className="mb-6 text-lg font-semibold">News Aggregator</div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                    pathname === item.href
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">{navItems.find((item) => item.href === pathname)?.label ?? 'Dashboard'}</h1>
              <p className="text-sm text-muted-foreground">Stay on top of the news in one place.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
