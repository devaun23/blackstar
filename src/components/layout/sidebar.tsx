'use client';

import { cn } from '@/lib/utils';
import { SidebarNav } from './sidebar-nav';
import { UserMenu } from './user-menu';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppUser } from './app-shell';

interface SidebarProps {
  user: AppUser;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ user, collapsed, onToggleCollapse, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        className,
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex h-14 items-center border-b border-border px-3',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        {!collapsed && (
          <span className="text-lg font-bold text-foreground tracking-tight">
            Blackstar
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <SidebarNav collapsed={collapsed} />
      </nav>

      {/* User menu at bottom */}
      <div className="border-t border-border p-3">
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
