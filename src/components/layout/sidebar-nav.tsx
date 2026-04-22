'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Brain, BookOpen, BarChart3 } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/study', label: 'Study', icon: Brain },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
] as const;

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1 px-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');

        const linkContent = (
          <Link
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              collapsed && 'justify-center px-2',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <li key={href}>
              <Tooltip>
                <TooltipTrigger render={(props) => (
                <Link
                  {...props}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    'justify-center px-2',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              )} />
                <TooltipContent side="right">
                  {label}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }

        return <li key={href}>{linkContent}</li>;
      })}
    </ul>
  );
}
