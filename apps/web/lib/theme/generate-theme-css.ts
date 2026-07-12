/**
 * Pure helpers that turn a ThemeConfig into CSS. Shared by the SSR injection in
 * app/layout.tsx, the client-side applier, and the live preview. No React or
 * next/font imports so it stays usable everywhere.
 */
import {
  THEME_TOKENS,
  type ThemeConfig,
  getFont,
  getPreset,
  getSize,
  normalizeTheme,
} from './theme-config';

/** DOM id of the <style> element the tenant theme is injected into. */
export const THEME_STYLE_ID = 'tenant-theme';

function radiusDecl(radius: number): string {
  return `--radius: ${radius}rem;`;
}

function fontFamily(fontId: string): string {
  const font = getFont(fontId);
  return font.stack ?? `var(${font.cssVar})`;
}

function fontDecl(fontId: string): string {
  return `--font-sans: ${fontFamily(fontId)};`;
}

function sizeDecl(sizeId: string): string {
  // Drives every rem-based dimension in the app (fonts, spacing, component
  // sizes) from a single root font-size.
  return `font-size: ${getSize(sizeId).rootPx}px;`;
}

/** Root font-size (px) for a config — used by the preview to scale via zoom. */
export function getSizePx(config: ThemeConfig): number {
  return getSize(config.size).rootPx;
}

/**
 * Build a full stylesheet string overriding CSS variables under `:root` (light)
 * and `.dark`. `--radius` and `--font-sans` are mode-independent and live on
 * `:root`.
 */
export function themeToCss(input: unknown): string {
  const config = normalizeTheme(input);
  const preset = getPreset(config.preset);

  const light = THEME_TOKENS.map(
    (token) => `  --${token}: ${preset.light[token]};`,
  ).join('\n');
  const dark = THEME_TOKENS.map(
    (token) => `  --${token}: ${preset.dark[token]};`,
  ).join('\n');

  // Doubled/compound selectors (specificity 0,2,0) so these overrides always
  // beat globals.css `:root` / `.dark` (specificity 0,1,0) regardless of the
  // order stylesheets land in <head>. `.dark` is applied to the root <html>.
  return [
    `:root:root {`,
    light,
    `  ${radiusDecl(config.radius)}`,
    `  ${fontDecl(config.font)}`,
    `  ${sizeDecl(config.size)}`,
    `}`,
    `:root.dark {`,
    dark,
    `}`,
  ].join('\n');
}

/**
 * CSS-variable map for one mode, for inline `style` on a scoped element such as
 * the live preview. Includes radius and font so the preview matches exactly.
 */
export function themeToVars(
  config: ThemeConfig,
  mode: 'light' | 'dark',
): Record<string, string> {
  const preset = getPreset(config.preset);
  const tokens = mode === 'dark' ? preset.dark : preset.light;
  const vars: Record<string, string> = {};
  for (const token of THEME_TOKENS) {
    vars[`--${token}`] = tokens[token];
  }
  vars['--radius'] = `${config.radius}rem`;
  vars['--font-sans'] = fontFamily(config.font);
  return vars;
}

/**
 * Replace (or create) the injected <style> so a theme change applies instantly
 * without a reload. No-op on the server.
 */
export function applyThemeToDocument(input: unknown): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(
    THEME_STYLE_ID,
  ) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = themeToCss(input);
}
