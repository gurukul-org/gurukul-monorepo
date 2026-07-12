'use client';

import * as React from 'react';

import { Label } from '@/components/ui/label';
import {
  FONTS,
  PRESETS,
  RADII,
  SIZES,
  type ThemeConfig,
} from '@/lib/theme/theme-config';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ThemeSelectorProps {
  value: ThemeConfig;
  onChange: (next: ThemeConfig) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Controls for choosing a theme preset, corner radius, and font. Emits a full
 * ThemeConfig on every change. Pair with <ThemePreview /> for a live preview.
 */
export function ThemeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ThemeSelectorProps) {
  return (
    <div className={cn('space-y-5', className)}>
      <div className="space-y-2">
        <Label className="text-xs">Color</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const selected = value.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, preset: preset.id })}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <span
                  className="size-4 shrink-0 rounded-full ring-1 ring-foreground/10"
                  style={{ backgroundColor: preset.swatch }}
                />
                <span className="truncate">{preset.label}</span>
                {selected && (
                  <Check className="ml-auto size-3.5 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Radius</Label>
        <div className="flex flex-wrap gap-2">
          {RADII.map((radius) => {
            const selected = value.radius === radius;
            return (
              <button
                key={radius}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, radius })}
                aria-pressed={selected}
                className={cn(
                  'h-7 min-w-11 rounded-md border px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                {radius}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Size</Label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const selected = value.size === size.id;
            return (
              <button
                key={size.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, size: size.id })}
                aria-pressed={selected}
                className={cn(
                  'h-7 rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme-font" className="text-xs">
          Font
        </Label>
        <select
          id="theme-font"
          value={value.font}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, font: event.target.value })}
          className="h-7 w-full max-w-xs rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {FONTS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
