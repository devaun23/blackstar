'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, LayoutDashboard, Brain, BookOpen, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenu } from './user-menu';
import type { AppUser } from './app-shell';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/study', label: 'Study', icon: Brain },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
] as const;

interface MobileNavProps {
  user: AppUser;
  className?: string;
}

export function MobileNav({ user, className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className={cn('flex h-14 items-center border-b border-border bg-sidebar px-4', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center border-b border-border px-4">
            <span className="text-lg font-bold tracking-tight">Blackstar</span>
          </div>
          <nav className="py-3">
            <ul className="space-y-1 px-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
            <UserMenu user={user} collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>

      <span className="ml-3 text-lg font-bold tracking-tight">Blackstar</span>
    </header>
  );
}
