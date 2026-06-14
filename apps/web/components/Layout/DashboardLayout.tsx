'use client';

import * as React from 'react';

import { AppSidebar } from '@/components/Layout/AppSidebar';
import { Header } from '@/components/Layout/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <Header />
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-900/40 p-4 md:p-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 md:p-6 min-h-[calc(100vh-theme(spacing.28))] shadow-sm">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
