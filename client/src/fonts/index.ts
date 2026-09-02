// ─────────────────────────────────────────────────────────────────────────────
// Google Sans Flex, self-hosted. PARKED — not currently in use.

// The site runs on the native system font stack instead (see globals.css).
// Everything below is the working setup, kept so it can be switched back on
// without redoing the research. The two .woff2 files beside this one are the
// exact binaries Google's CDN serves — verified metrically identical to
// "Google Sans Flex" at weights 300 / 400 / 500 / 700.

// TO RE-ENABLE — three steps:

//   1. Uncomment the block below.

//   2. src/app/layout.tsx:
//        import { googleSans, googleSansExt } from "@/fonts";
//        import { cn } from "@/lib/utils";
//        <html lang="en" className={cn(googleSans.variable, googleSansExt.variable)}>

//   3. src/app/globals.css — inside `@theme inline`, comment out the system
//      --font-sans and uncomment the Google Sans Flex chain sitting next to it.

// DO NOT go back to the old CDN approach:
//   <link rel="stylesheet" media="print" onLoad="this.media='all'" />
// React silently drops string event handlers, so the stylesheet stays
// media="print" and the font never applies on screen. That shipped to prod and
// went unnoticed because Segoe UI quietly took over from the fallback list.
// ─────────────────────────────────────────────────────────────────────────────

import localFont from "next/font/local";

// Two files because Google subsets the woff2 per script; the font-family
// chain in globals.css resolves per-glyph, so no unicode-range is needed.
//
// adjustFontFallback must stay off: next/font would otherwise inject an
// Arial-metric "Fallback" face straight after the latin one, and latin-ext
// (accented characters) would never be reached.

export const googleSans = localFont({
  src: "./GoogleSansFlex-latin.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-sans-latin",
  adjustFontFallback: false,
});

// Only fetched when a glyph is actually missing from the latin file.
export const googleSansExt = localFont({
  src: "./GoogleSansFlex-latin-ext.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-sans-ext",
  adjustFontFallback: false,
  preload: false,
});

// Keeps this a module while the code above is commented out (isolatedModules).
export {};
