/**
 * next/font instances for the curated Google-font options. Each exposes a CSS
 * variable (matching FONTS[*].cssVar in theme-config.ts). All variables are
 * attached to <html> so the tenant theme can point `--font-sans` at any of them
 * with no layout shift. System fonts (e.g. Times New Roman) have no instance
 * here — they are applied directly via their `stack` in theme-config.ts.
 * This module is imported by the server root layout only.
 *
 * Non-default families use `preload: false`: their @font-face is registered but
 * only fetched when a tenant actually selects them (only one is ever active).
 */
import {
  Inter,
  Lato,
  Merriweather,
  Montserrat,
  Nunito,
  Open_Sans,
  Oxanium,
  Playfair_Display,
  Poppins,
  Raleway,
  Roboto,
  Source_Sans_3,
  Work_Sans,
} from 'next/font/google';

const oxanium = Oxanium({ subsets: ['latin'], variable: '--font-oxanium' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  preload: false,
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  preload: false,
});
const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  preload: false,
});
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  preload: false,
});
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  preload: false,
});
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  preload: false,
});
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  preload: false,
});
const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  preload: false,
});
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  preload: false,
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  preload: false,
});

/** Combined className exposing every font variable on <html>. */
export const fontVariables = [
  oxanium.variable,
  inter.variable,
  roboto.variable,
  poppins.variable,
  openSans.variable,
  lato.variable,
  montserrat.variable,
  nunito.variable,
  raleway.variable,
  workSans.variable,
  sourceSans.variable,
  merriweather.variable,
  playfair.variable,
].join(' ');
