'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSizePx, themeToVars } from '@/lib/theme/generate-theme-css';
import { type ThemeConfig } from '@/lib/theme/theme-config';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  LayoutDashboard,
  Moon,
  Settings,
  Sun,
  Users,
} from 'lucide-react';

interface ThemePreviewProps {
  value: ThemeConfig;
  className?: string;
}

type PreviewMode = 'light' | 'dark';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Students', icon: Users, active: false },
  { label: 'Academics', icon: BookOpen, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

/**
 * Self-contained live preview of a theme. The showcase is scoped with inline CSS
 * variables (and a `.dark` class for dark mode) so it reflects the selected
 * config independently of the surrounding app. Size is previewed via `zoom`
 * because rem units resolve against the document root, not a scoped element.
 * Mirrors the app: a sidebar, buttons, inputs, badges, a card, and a modal.
 */
export function ThemePreview({ value, className }: ThemePreviewProps) {
  const [mode, setMode] = React.useState<PreviewMode>('light');

  const surfaceStyle = {
    ...themeToVars(value, mode),
    zoom: getSizePx(value) / 16,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Preview
        </span>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setMode('light')}
            aria-pressed={mode === 'light'}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-0.5 text-[0.625rem] font-medium transition-colors',
              mode === 'light'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sun className="size-3" /> Light
          </button>
          <button
            type="button"
            onClick={() => setMode('dark')}
            aria-pressed={mode === 'dark'}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-0.5 text-[0.625rem] font-medium transition-colors',
              mode === 'dark'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Moon className="size-3" /> Dark
          </button>
        </div>
      </div>

      <div
        className={cn(
          'font-sans flex text-foreground',
          mode === 'dark' && 'dark',
        )}
        style={surfaceStyle}
      >
        {/* Sidebar mock — uses the sidebar tokens, distinct from the primary. */}
        <aside className="hidden w-40 shrink-0 flex-col gap-3 bg-sidebar p-3 text-sidebar-foreground sm:flex">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-accent text-xs font-bold">
              G
            </div>
            <span className="text-xs font-semibold">Gurukul</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <span
                key={item.label}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium',
                  item.active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70',
                )}
              >
                <item.icon className="size-3.5 shrink-0" />
                {item.label}
              </span>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <div className="min-w-0 flex-1 space-y-4 bg-background p-5">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
            <Button size="sm" variant="ghost">
              Ghost
            </Button>
            <Button size="sm" variant="destructive">
              Destructive
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preview-email">Email</Label>
              <Input
                id="preview-email"
                placeholder="you@example.com"
                readOnly
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project settings</CardTitle>
                <CardDescription>Manage how things look.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm">Save</Button>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Faux modal — inline (not portalled) so scoped theme vars apply. */}
          <div className="relative rounded-lg bg-muted/40 p-4">
            <div className="mx-auto max-w-xs rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
              <p className="font-heading text-sm font-medium">Are you sure?</p>
              <p className="mt-1 text-xs/relaxed text-muted-foreground">
                This updates the workspace theme for everyone.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
                <Button size="sm">Confirm</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
