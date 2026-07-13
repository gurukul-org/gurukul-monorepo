'use client';

import * as React from 'react';
import { useMemo } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { KeyRound, Palette, Settings, Shield, User, Users } from 'lucide-react';

import { PERMS } from '@repo/permissions';

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'security', label: 'Security', icon: KeyRound },
    ],
  },
  {
    label: 'Organization',
    items: [
      { id: 'team', label: 'Team', icon: Users },
      { id: 'roles', label: 'Roles & Permissions', icon: Shield },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'general', label: 'General', icon: Settings },
    ],
  },
];

export default function SettingsLayoutContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const basePath = '/settings';
  const { hasPermission } = usePermission();

  // Extract the active panel from the pathname (e.g. /settings/profile -> profile)
  const activePanel = pathname.split('/').pop() || 'profile';

  // Filter sections dynamically based on user permissions
  const filteredSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => {
      const items = section.items.filter((item) => {
        if (item.id === 'team') {
          return (
            hasPermission(PERMS.user.view) || hasPermission(PERMS.user.invite)
          );
        }
        if (item.id === 'roles') {
          return hasPermission(PERMS.role.view);
        }
        if (item.id === 'appearance') {
          return hasPermission(PERMS.appearance.view);
        }
        if (item.id === 'general') {
          return hasPermission(PERMS.tenant.view);
        }
        return true; // Profile and Security are always allowed
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [hasPermission]);

  return (
    <div className="flex gap-8">
      {/* Left vertical nav */}
      <nav className="w-48 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Settings</h1>
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div key={section.label}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                {section.label}
              </span>
              <ul className="mt-2 space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`${basePath}/${item.id}`}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150',
                        activePanel === item.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Content area */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
