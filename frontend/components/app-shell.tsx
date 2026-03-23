'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  ChevronDown,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { clearToken } from '@/lib/auth/token';
import { ThemeToggle } from '@/components/theme-toggle';
import { fetchProfile } from '@/lib/api/profile';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/compose', label: 'Compose', icon: PenSquare },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/read', label: 'Read', icon: CheckCircle2 },
  { href: '/preferences', label: 'Preferences', icon: SlidersHorizontal },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: Shield },
];

const navLinkClassName = (isActive: boolean) =>
  cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
  );

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Account';

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="flex min-h-screen min-w-0">
        <aside className="hidden w-64 flex-col border-r border-border bg-card p-6 lg:flex">
          <Link href="/" className="mb-6 flex items-center">
            <img src="/ubevera-logo.svg" alt="Ubevera" className="h-6 w-auto" />
          </Link>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClassName(pathname === item.href)}
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
                  <SheetContent
                    side="left"
                    className="w-[280px] max-w-[85vw] p-6"
                  >
                    <SheetClose asChild>
                      <Link href="/" className="mb-6 flex items-center">
                        <img src="/ubevera-logo.svg" alt="Ubevera" className="h-6 w-auto" />
                      </Link>
                    </SheetClose>
                    <nav className="flex flex-col gap-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className={navLinkClassName(
                                pathname === item.href,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          </SheetClose>
                        );
                      })}
                      <div className="mt-2 border-t border-border pt-2">
                        <SheetClose asChild>
                          <button
                            onClick={handleLogout}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent text-destructive',
                            )}
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </SheetClose>
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
                <Link href="/" className="flex items-center lg:hidden">
                  <img src="/ubevera-icon.svg" alt="Ubevera" className="h-6 w-6" />
                </Link>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold lg:text-lg">
                    {navItems.find((item) => item.href === pathname)?.label ??
                      'Dashboard'}
                  </h1>
                  <p className="hidden truncate text-sm text-muted-foreground lg:block">
                    Stay on top of the news in one place.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4" />
                      <span className="ml-1 max-w-[120px] truncate hidden sm:inline">{displayName}</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
