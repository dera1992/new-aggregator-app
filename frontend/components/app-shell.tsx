'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Newspaper,
  Archive,
  Bookmark,
  CheckCircle2,
  Menu,
  Settings,
  SlidersHorizontal,
  PenSquare,
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { clearToken } from '@/lib/auth/token';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="flex min-h-screen min-w-0">
        <aside className="hidden w-64 flex-col border-r border-border bg-card p-6 lg:flex">
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
                      ? 'bg-accent text-accent-foreground'
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
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border bg-background px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] max-w-[85vw] p-6">
                    <div className="mb-6 text-lg font-semibold">News Aggregator</div>
                    <nav className="flex flex-col gap-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                                pathname === item.href
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-muted-foreground',
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </nav>
                  </SheetContent>
                </Sheet>
                <span className="text-lg font-semibold lg:hidden">News Aggregator</span>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold">
                    {navItems.find((item) => item.href === pathname)?.label ?? 'Dashboard'}
                  </h1>
                  <p className="truncate text-sm text-muted-foreground">
                    Stay on top of the news in one place.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
