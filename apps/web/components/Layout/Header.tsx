'use client';

import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthUser } from '@/lib/store/auth';
import { useRequestLogout } from '@/services/api/requests/auth';
import { useCurrentUserProfile } from '@/services/api/requests/users';
import { LogOut, Settings } from 'lucide-react';

export function Header() {
  const user = useAuthUser();
  const logout = useRequestLogout();
  const { data: profile } = useCurrentUserProfile();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="h-4 bg-zinc-200 dark:bg-zinc-800"
        />
        <div className="flex items-center gap-1.5 font-semibold text-lg tracking-tight select-none">
          <span className="text-primary font-extrabold bg-primary/10 px-2 py-0.5 rounded text-sm uppercase">
            SaaS
          </span>
          <span className="text-zinc-850 dark:text-zinc-100">GURUKUL</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800 hover:opacity-95 transition-opacity cursor-pointer">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold uppercase">
                {profile
                  ? `${profile.firstName.slice(0, 1)}${profile.lastName.slice(0, 1)}`
                  : user?.email?.slice(0, 2) || 'US'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 mt-1 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 bg-card p-1.5"
          >
            <DropdownMenuLabel className="px-2.5 py-2 flex flex-col">
              <span className="text-xs font-semibold text-foreground truncate">
                {profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : 'Administrator'}
              </span>
              <span
                className="text-[10px] font-normal text-muted-foreground truncate mt-0.5"
                title={profile?.email || user?.email || 'user@gurukul.com'}
              >
                {profile?.email || user?.email || 'user@gurukul.com'}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-850" />
            <DropdownMenuItem
              asChild
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-foreground"
            >
              <a href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-850" />
            <DropdownMenuItem
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-destructive hover:text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
