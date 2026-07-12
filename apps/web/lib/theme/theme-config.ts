/**
 * Framework-agnostic theme registry shared by SSR injection, the client-side
 * applier, and the settings/onboarding selectors. Keep this file free of
 * `next/font` and `'use client'` so it can be imported from server components,
 * client components, and plain utilities alike.
 *
 * The tenant only stores a compact reference ({ preset, radius, font, size });
 * the actual token values live here in code.
 */

/** Every shadcn color token we drive per theme. */
export const THEME_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];
export type TokenMap = Record<ThemeToken, string>;

export interface ThemePreset {
  id: string;
  label: string;
  /** Small hex swatch for the preset grid (approximation of the primary). */
  swatch: string;
  light: TokenMap;
  dark: TokenMap;
}

export interface FontOption {
  id: string;
  label: string;
  /** CSS variable emitted by next/font (Google fonts, see lib/theme/fonts.ts). */
  cssVar?: string;
  /** Explicit font-family stack for system fonts (no next/font instance). */
  stack?: string;
}

export interface SizeOption {
  id: string;
  label: string;
  /** Root font-size in px; every rem-based dimension scales from this. */
  rootPx: number;
}

export interface ThemeConfig {
  preset: string;
  /** Base corner radius in rem, mapped to `--radius`. */
  radius: number;
  font: string;
  /** Global scale key (see SIZES). */
  size: string;
}

function ok(l: number, c: number, h: number): string {
  return `oklch(${l} ${c} ${h})`;
}

// Neutral multi-hue chart ramp (shadcn default) shared by non-default presets.
const CHARTS = {
  'chart-1': 'oklch(0.646 0.222 41.116)',
  'chart-2': 'oklch(0.6 0.118 184.704)',
  'chart-3': 'oklch(0.398 0.07 227.392)',
  'chart-4': 'oklch(0.828 0.189 84.429)',
  'chart-5': 'oklch(0.769 0.188 70.08)',
};

interface AccentSpec {
  primary: string;
  primaryForeground: string;
  ring: string;
}

/**
 * Builds a full, theme-tinted token set from a single hue. Surfaces
 * (background/card/muted/border) carry a subtle tint (`nc`).
 *
 * The sidebar is mode-aware and always keeps light (white) text:
 *  - Light mode: a saturated shade of the theme color (`sc` = chroma).
 *  - Dark mode: a near-black, subtly theme-tinted surface.
 * In both modes it stays distinct from the primary/button color.
 */
function makePreset(
  id: string,
  label: string,
  swatch: string,
  hue: number,
  nc: number,
  sc: number,
  sidebarPrimary: string,
  lightAccent: AccentSpec,
  darkAccent: AccentSpec,
): ThemePreset {
  const lightSidebar = {
    sidebar: ok(0.48, sc, hue),
    'sidebar-foreground': ok(0.985, 0.015, hue),
    'sidebar-primary': ok(0.985, 0.02, hue),
    'sidebar-primary-foreground': ok(0.4, sc, hue),
    'sidebar-accent': ok(0.42, sc, hue),
    'sidebar-accent-foreground': ok(0.985, 0.015, hue),
    'sidebar-border': 'oklch(1 0 0 / 18%)',
    'sidebar-ring': ok(0.985, 0.02, hue),
  };
  const darkSidebar = {
    sidebar: ok(0.17, sc * 0.3, hue),
    'sidebar-foreground': ok(0.96, 0.01, hue),
    'sidebar-primary': sidebarPrimary,
    'sidebar-primary-foreground': ok(0.17, sc * 0.3, hue),
    'sidebar-accent': ok(0.27, sc * 0.4, hue),
    'sidebar-accent-foreground': ok(0.96, 0.01, hue),
    'sidebar-border': 'oklch(1 0 0 / 10%)',
    'sidebar-ring': sidebarPrimary,
  };

  // Dark-mode surface tint: strong enough that dark backgrounds read as a dark
  // shade of the theme (dark violet/green/teal…) rather than neutral black,
  // while staying dark enough for light text. Zinc (tiny sc) stays neutral.
  const dtc = Math.min(sc * 0.42, 0.055);

  return {
    id,
    label,
    swatch,
    light: {
      background: ok(0.995, nc * 0.5, hue),
      foreground: ok(0.145, nc, hue),
      card: ok(1, 0, hue),
      'card-foreground': ok(0.145, nc, hue),
      popover: ok(1, 0, hue),
      'popover-foreground': ok(0.145, nc, hue),
      primary: lightAccent.primary,
      'primary-foreground': lightAccent.primaryForeground,
      secondary: ok(0.965, nc, hue),
      'secondary-foreground': ok(0.21, nc * 1.5, hue),
      muted: ok(0.965, nc, hue),
      'muted-foreground': ok(0.55, nc * 2.5, hue),
      accent: ok(0.965, nc, hue),
      'accent-foreground': ok(0.21, nc * 1.5, hue),
      destructive: 'oklch(0.577 0.245 27.325)',
      border: ok(0.92, nc, hue),
      input: ok(0.92, nc, hue),
      ring: lightAccent.ring,
      ...CHARTS,
      ...lightSidebar,
    } as TokenMap,
    dark: {
      background: ok(0.185, dtc, hue),
      foreground: ok(0.98, 0.012, hue),
      card: ok(0.235, dtc, hue),
      'card-foreground': ok(0.98, 0.012, hue),
      popover: ok(0.235, dtc, hue),
      'popover-foreground': ok(0.98, 0.012, hue),
      primary: darkAccent.primary,
      'primary-foreground': darkAccent.primaryForeground,
      secondary: ok(0.29, dtc, hue),
      'secondary-foreground': ok(0.98, 0.012, hue),
      muted: ok(0.29, dtc, hue),
      'muted-foreground': ok(0.72, dtc * 1.4, hue),
      accent: ok(0.29, dtc, hue),
      'accent-foreground': ok(0.98, 0.012, hue),
      destructive: 'oklch(0.704 0.191 22.216)',
      border: 'oklch(1 0 0 / 12%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: darkAccent.ring,
      ...CHARTS,
      ...darkSidebar,
    } as TokenMap,
  };
}

/**
 * The "default" preset mirrors the current app/globals.css values verbatim
 * (teal primary + teal sidebar) so workspaces choosing it look identical to the
 * pre-theming app.
 */
const DEFAULT_PRESET: ThemePreset = {
  id: 'default',
  label: 'Default',
  swatch: '#0f766e',
  light: {
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.141 0.005 285.823)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.141 0.005 285.823)',
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.141 0.005 285.823)',
    primary: 'oklch(0.511 0.096 186.391)',
    'primary-foreground': 'oklch(0.984 0.014 180.72)',
    secondary: 'oklch(0.967 0.001 286.375)',
    'secondary-foreground': 'oklch(0.21 0.006 285.885)',
    muted: 'oklch(0.967 0.001 286.375)',
    'muted-foreground': 'oklch(0.552 0.016 285.938)',
    accent: 'oklch(0.967 0.001 286.375)',
    'accent-foreground': 'oklch(0.21 0.006 285.885)',
    destructive: 'oklch(0.577 0.245 27.325)',
    border: 'oklch(0.92 0.004 286.32)',
    input: 'oklch(0.92 0.004 286.32)',
    ring: 'oklch(0.705 0.015 286.067)',
    'chart-1': 'oklch(0.855 0.138 181.071)',
    'chart-2': 'oklch(0.704 0.14 182.503)',
    'chart-3': 'oklch(0.6 0.118 184.704)',
    'chart-4': 'oklch(0.511 0.096 186.391)',
    'chart-5': 'oklch(0.437 0.078 188.216)',
    sidebar: 'oklch(0.235 0.04 195)',
    'sidebar-foreground': 'oklch(0.95 0.01 195)',
    'sidebar-primary': 'oklch(0.85 0.1 190)',
    'sidebar-primary-foreground': 'oklch(0.2 0.04 195)',
    'sidebar-accent': 'oklch(0.3 0.04 195)',
    'sidebar-accent-foreground': 'oklch(0.95 0.01 195)',
    'sidebar-border': 'oklch(1 0 0 / 10%)',
    'sidebar-ring': 'oklch(0.6 0.08 190)',
  },
  dark: {
    background: 'oklch(0.141 0.005 285.823)',
    foreground: 'oklch(0.985 0 0)',
    card: 'oklch(0.21 0.006 285.885)',
    'card-foreground': 'oklch(0.985 0 0)',
    popover: 'oklch(0.21 0.006 285.885)',
    'popover-foreground': 'oklch(0.985 0 0)',
    primary: 'oklch(0.437 0.078 188.216)',
    'primary-foreground': 'oklch(0.984 0.014 180.72)',
    secondary: 'oklch(0.274 0.006 286.033)',
    'secondary-foreground': 'oklch(0.985 0 0)',
    muted: 'oklch(0.274 0.006 286.033)',
    'muted-foreground': 'oklch(0.705 0.015 286.067)',
    accent: 'oklch(0.274 0.006 286.033)',
    'accent-foreground': 'oklch(0.985 0 0)',
    destructive: 'oklch(0.704 0.191 22.216)',
    border: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
    ring: 'oklch(0.552 0.016 285.938)',
    'chart-1': 'oklch(0.855 0.138 181.071)',
    'chart-2': 'oklch(0.704 0.14 182.503)',
    'chart-3': 'oklch(0.6 0.118 184.704)',
    'chart-4': 'oklch(0.511 0.096 186.391)',
    'chart-5': 'oklch(0.437 0.078 188.216)',
    sidebar: 'oklch(0.2 0.04 195)',
    'sidebar-foreground': 'oklch(0.95 0.01 195)',
    'sidebar-primary': 'oklch(0.85 0.1 190)',
    'sidebar-primary-foreground': 'oklch(0.2 0.04 195)',
    'sidebar-accent': 'oklch(0.28 0.04 195)',
    'sidebar-accent-foreground': 'oklch(0.95 0.01 195)',
    'sidebar-border': 'oklch(1 0 0 / 10%)',
    'sidebar-ring': 'oklch(0.6 0.08 190)',
  },
};

export const PRESETS: ThemePreset[] = [
  DEFAULT_PRESET,
  makePreset(
    'zinc',
    'Zinc',
    '#52525b',
    285.9,
    0.004,
    0.008,
    'oklch(0.985 0 0)',
    {
      primary: 'oklch(0.21 0.006 285.885)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.705 0.015 286.067)',
    },
    {
      primary: 'oklch(0.92 0.004 286.32)',
      primaryForeground: 'oklch(0.21 0.006 285.885)',
      ring: 'oklch(0.552 0.016 285.938)',
    },
  ),
  makePreset(
    'blue',
    'Blue',
    '#3b82f6',
    262.9,
    0.01,
    0.13,
    'oklch(0.623 0.214 259.815)',
    {
      primary: 'oklch(0.546 0.245 262.881)',
      primaryForeground: 'oklch(0.97 0.014 254.604)',
      ring: 'oklch(0.546 0.245 262.881)',
    },
    {
      primary: 'oklch(0.623 0.214 259.815)',
      primaryForeground: 'oklch(0.97 0.014 254.604)',
      ring: 'oklch(0.623 0.214 259.815)',
    },
  ),
  makePreset(
    'rose',
    'Rose',
    '#e11d48',
    17.6,
    0.01,
    0.13,
    'oklch(0.645 0.246 16.439)',
    {
      primary: 'oklch(0.586 0.253 17.585)',
      primaryForeground: 'oklch(0.969 0.015 12.422)',
      ring: 'oklch(0.586 0.253 17.585)',
    },
    {
      primary: 'oklch(0.645 0.246 16.439)',
      primaryForeground: 'oklch(0.969 0.015 12.422)',
      ring: 'oklch(0.645 0.246 16.439)',
    },
  ),
  makePreset(
    'green',
    'Green',
    '#16a34a',
    163.2,
    0.01,
    0.13,
    'oklch(0.696 0.17 162.48)',
    {
      primary: 'oklch(0.596 0.145 163.225)',
      primaryForeground: 'oklch(0.979 0.021 166.113)',
      ring: 'oklch(0.596 0.145 163.225)',
    },
    {
      primary: 'oklch(0.696 0.17 162.48)',
      primaryForeground: 'oklch(0.393 0.095 152.535)',
      ring: 'oklch(0.696 0.17 162.48)',
    },
  ),
  makePreset(
    'violet',
    'Violet',
    '#7c3aed',
    293,
    0.01,
    0.13,
    'oklch(0.606 0.25 292.717)',
    {
      primary: 'oklch(0.541 0.281 293.009)',
      primaryForeground: 'oklch(0.969 0.016 293.756)',
      ring: 'oklch(0.541 0.281 293.009)',
    },
    {
      primary: 'oklch(0.606 0.25 292.717)',
      primaryForeground: 'oklch(0.969 0.016 293.756)',
      ring: 'oklch(0.606 0.25 292.717)',
    },
  ),
  makePreset(
    'orange',
    'Orange',
    '#f97316',
    55,
    0.01,
    0.14,
    'oklch(0.72 0.16 55)',
    {
      primary: 'oklch(0.66 0.17 55)',
      primaryForeground: 'oklch(0.98 0.02 60)',
      ring: 'oklch(0.66 0.17 55)',
    },
    {
      primary: 'oklch(0.72 0.16 55)',
      primaryForeground: 'oklch(0.27 0.06 55)',
      ring: 'oklch(0.72 0.16 55)',
    },
  ),
  makePreset(
    'cyan',
    'Cyan',
    '#0891b2',
    225,
    0.01,
    0.13,
    'oklch(0.72 0.12 225)',
    {
      primary: 'oklch(0.6 0.13 225)',
      primaryForeground: 'oklch(0.98 0.02 225)',
      ring: 'oklch(0.6 0.13 225)',
    },
    {
      primary: 'oklch(0.72 0.12 225)',
      primaryForeground: 'oklch(0.27 0.06 225)',
      ring: 'oklch(0.72 0.12 225)',
    },
  ),
  // "Aubergine" is Slack's default theme colour (deep magenta-purple).
  makePreset(
    'aubergine',
    'Aubergine',
    '#a21caf',
    330,
    0.012,
    0.14,
    'oklch(0.66 0.24 330)',
    {
      primary: 'oklch(0.55 0.24 330)',
      primaryForeground: 'oklch(0.97 0.02 330)',
      ring: 'oklch(0.55 0.24 330)',
    },
    {
      primary: 'oklch(0.66 0.24 330)',
      primaryForeground: 'oklch(0.97 0.02 330)',
      ring: 'oklch(0.66 0.24 330)',
    },
  ),
];

/**
 * Curated font options. `cssVar` must match the variable configured for the
 * corresponding next/font instance in lib/theme/fonts.ts.
 */
export const FONTS: FontOption[] = [
  { id: 'oxanium', label: 'Oxanium', cssVar: '--font-oxanium' },
  { id: 'inter', label: 'Inter', cssVar: '--font-inter' },
  { id: 'roboto', label: 'Roboto', cssVar: '--font-roboto' },
  { id: 'poppins', label: 'Poppins', cssVar: '--font-poppins' },
  { id: 'open-sans', label: 'Open Sans', cssVar: '--font-open-sans' },
  { id: 'lato', label: 'Lato', cssVar: '--font-lato' },
  { id: 'montserrat', label: 'Montserrat', cssVar: '--font-montserrat' },
  { id: 'nunito', label: 'Nunito', cssVar: '--font-nunito' },
  { id: 'raleway', label: 'Raleway', cssVar: '--font-raleway' },
  { id: 'work-sans', label: 'Work Sans', cssVar: '--font-work-sans' },
  { id: 'source-sans', label: 'Source Sans', cssVar: '--font-source-sans' },
  { id: 'merriweather', label: 'Merriweather', cssVar: '--font-merriweather' },
  { id: 'playfair', label: 'Playfair Display', cssVar: '--font-playfair' },
  {
    id: 'times',
    label: 'Times New Roman',
    stack: '"Times New Roman", Times, serif',
  },
  {
    id: 'sans-serif',
    label: 'Sans Serif',
    stack:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
];

/** Radius options (rem) offered by the selector, mirroring shadcn's picker. */
export const RADII = [0, 0.3, 0.5, 0.75, 1.0] as const;

/**
 * Global size options. The UI shows the friendly labels; `rootPx` is applied to
 * the document root font-size so every rem-based dimension (fonts, spacing,
 * component heights/widths) scales together across the whole app.
 */
export const SIZES: SizeOption[] = [
  { id: 'sm', label: 'Small', rootPx: 14 },
  { id: 'md', label: 'Medium', rootPx: 16 },
  { id: 'lg', label: 'Large', rootPx: 18 },
];

export const PRESET_IDS = PRESETS.map((p) => p.id);
export const FONT_IDS = FONTS.map((f) => f.id);
export const SIZE_IDS = SIZES.map((s) => s.id);

export const DEFAULT_THEME: ThemeConfig = {
  preset: 'default',
  radius: 0.5,
  font: 'oxanium',
  size: 'md',
};

export function getPreset(id: string): ThemePreset {
  return PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET;
}

export function getFont(id: string): FontOption {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]!;
}

export function getSize(id: string): SizeOption {
  return SIZES.find((s) => s.id === id) ?? SIZES[1]!;
}

/** Coerce an arbitrary/partial stored value into a valid ThemeConfig. */
export function normalizeTheme(input: unknown): ThemeConfig {
  const raw = (input ?? {}) as Partial<ThemeConfig>;
  const preset = PRESET_IDS.includes(raw.preset as string)
    ? (raw.preset as string)
    : DEFAULT_THEME.preset;
  const font = FONT_IDS.includes(raw.font as string)
    ? (raw.font as string)
    : DEFAULT_THEME.font;
  const size = SIZE_IDS.includes(raw.size as string)
    ? (raw.size as string)
    : DEFAULT_THEME.size;
  const radius =
    typeof raw.radius === 'number' && raw.radius >= 0 && raw.radius <= 2
      ? raw.radius
      : DEFAULT_THEME.radius;
  return { preset, radius, font, size };
}
