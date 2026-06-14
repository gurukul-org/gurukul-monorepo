'use client';

import * as React from 'react';

import Link from 'next/link';

import {
  ProfilePanel,
  SecurityPanel,
} from '@/components/Layout/ProfileSettings';
import { cn } from '@/lib/utils';
import { KeyRound, Settings, Shield, User } from 'lucide-react';

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
      { id: 'permissions', label: 'Permissions', icon: Shield },
      { id: 'general', label: 'General', icon: Settings },
    ],
  },
];

interface TenantSettingsProps {
  activePanel: string;
}

export default function TenantSettings({ activePanel }: TenantSettingsProps) {
  return (
    <div className="flex gap-8">
      {/* Left vertical nav */}
      <nav className="w-48 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Settings</h1>
        <div className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                {section.label}
              </span>
              <ul className="mt-2 space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/settings/${item.id}`}
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
      <div className="flex-1 min-w-0">
        {activePanel === 'profile' && <ProfilePanel />}
        {activePanel === 'security' && <SecurityPanel />}
        {activePanel === 'permissions' && (
          <div className="text-sm text-muted-foreground">
            This is{' '}
            <span className="font-medium text-foreground">permissions</span>{' '}
            settings.
          </div>
        )}
        {activePanel === 'general' && (
          <div className="text-sm text-muted-foreground">
            This is <span className="font-medium text-foreground">general</span>{' '}
            settings.
          </div>
        )}
      </div>
    </div>
  );
}
