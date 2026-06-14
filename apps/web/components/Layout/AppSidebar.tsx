'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSubdomain } from '@/hooks/use-subdomain';
import { useAuthUser } from '@/lib/store/auth';
import { useRequestLogout } from '@/services/api/requests/auth';
import { useCurrentTenant } from '@/services/api/requests/tenants';
import { useCurrentUserProfile } from '@/services/api/requests/users';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthUser();
  const { subdomain } = useSubdomain();
  const logout = useRequestLogout();
  const { state } = useSidebar();
  const { data: tenant } = useCurrentTenant();
  const { data: profile } = useCurrentUserProfile();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      active: pathname === '/dashboard',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <Sidebar collapsible="icon" className="!border-r-0">
      <SidebarHeader className="h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground font-bold text-lg">
            G
          </div>
          {state !== 'collapsed' && (
            <div className="flex flex-col text-left leading-none">
              <span
                className="font-semibold text-sm tracking-tight truncate max-w-[130px] text-sidebar-foreground"
                title={tenant?.name || 'Gurukul'}
              >
                {tenant?.name || 'Gurukul'}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 uppercase font-medium tracking-wider truncate max-w-[130px]">
                {tenant?.subdomain || subdomain || 'Portal'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu className="px-2 gap-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.active}
                className="w-full justify-start gap-3 transition-colors"
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            {state !== 'collapsed' ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="h-7 w-7 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center text-xs font-semibold shrink-0 uppercase">
                    {profile
                      ? profile.firstName.charAt(0)
                      : user?.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium text-sidebar-foreground truncate max-w-[110px]">
                      {profile
                        ? `${profile.firstName} ${profile.lastName}`
                        : user?.email || 'User'}
                    </span>
                    <span
                      className="text-[9px] text-sidebar-foreground/50 truncate max-w-[110px]"
                      title={profile?.email || user?.email || 'Administrator'}
                    >
                      {profile?.email || user?.email || 'Administrator'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  title="Sign out"
                  className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-red-400 transition-colors shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <SidebarMenuButton
                onClick={() => logout.mutate()}
                className="w-full justify-center text-sidebar-foreground/50 hover:text-red-400"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
