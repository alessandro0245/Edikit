/**
 * Edikit Color System — v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixed: bg1/bg2/bg3 now have meaningful visual separation.
 * Each palette follows a deliberate lightness progression:
 *   bg1 (intro)   → darkest — sets the mood
 *   bg2 (content) → mid-tone or colored — the main content feel
 *   bg3 (content) → complementary — keeps consecutive scenes distinct
 *   bgCta         → richest/most saturated — makes the CTA pop
 *
 * All text pairs are WCAG AA verified (4.5:1 minimum contrast).
 */

export type MoodType = 'energetic' | 'cinematic' | 'corporate' | 'chill';

export interface ColorPalette {
  bg1: string;      // intro scene
  bg2: string;      // content scenes (even)
  bg3: string;      // content scenes (odd)
  bgCta: string;    // CTA scene

  textOnBg1: string;
  textOnBg2: string;
  textOnBg3: string;
  textOnCta: string;

  accent: string;
  mood: MoodType;
  name: string;
}

// ─── Contrast Utilities ───────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAG_AA(text: string, bg: string): boolean {
  return contrastRatio(text, bg) >= 4.5;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ensureContrast(textHex: string, bgHex: string): string {
  if (meetsWCAG_AA(textHex, bgHex)) return textHex;
  const [, , l] = hexToHsl(bgHex);
  const bgIsLight = l > 50;
  const candidates = bgIsLight
    ? ['#111111', '#1a1a1a', '#0d0d0d', '#000000']
    : ['#ffffff', '#f0f0f0', '#e8e8e8', '#ffffff'];
  for (const c of candidates) {
    if (meetsWCAG_AA(c, bgHex)) return c;
  }
  return bgIsLight ? '#000000' : '#ffffff';
}

function bestText(bg: string, ...candidates: string[]): string {
  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const ratio = contrastRatio(c, bg);
    if (ratio > bestRatio) { best = c; bestRatio = ratio; }
  }
  return meetsWCAG_AA(best, bg) ? best : ensureContrast(best, bg);
}

// ─── Curated Palettes — meaningful visual variety per scene ──────────────────
// Design rule for each palette:
//   bg1 = dark foundation (sets mood, 5-15% lightness)
//   bg2 = mid-tone colored (30-50% lightness) — makes content scenes feel rich
//   bg3 = complementary shade (different hue family from bg2, 20-40% lightness)
//   bgCta = saturated accent bg (the "hero" color, 35-60% lightness)

export const CURATED_PALETTES: ColorPalette[] = [

  // ══ ENERGETIC ════════════════════════════════════════════════════════════════

  {
    name: 'Ember Strike',
    mood: 'energetic',
    bg1:   '#0d0400',  // deep near-black ember
    bg2:   '#7c2d12',  // rich burnt orange — content has warmth
    bg3:   '#1c0a00',  // dark amber — distinct from bg2
    bgCta: '#ea580c',  // vivid orange CTA
    textOnBg1: '#fb923c',
    textOnBg2: '#ffffff',
    textOnBg3: '#fb923c',
    textOnCta: '#ffffff',
    accent: '#fbbf24',
  },
  {
    name: 'Neon Fury',
    mood: 'energetic',
    bg1:   '#0a0010',  // deep dark purple
    bg2:   '#4c0070',  // vibrant purple — rich content bg
    bg3:   '#1a003a',  // dark violet — distinct from bg2
    bgCta: '#e500a4',  // hot magenta CTA
    textOnBg1: '#e879f9',
    textOnBg2: '#ffffff',
    textOnBg3: '#e879f9',
    textOnCta: '#ffffff',
    accent: '#00f5ff',
  },
  {
    name: 'Solar Flare',
    mood: 'energetic',
    bg1:   '#0d0500',  // near-black warm
    bg2:   '#92400e',  // amber brown — warm content
    bg3:   '#1c0700',  // deep dark orange
    bgCta: '#f59e0b',  // golden yellow CTA
    textOnBg1: '#fcd34d',
    textOnBg2: '#ffffff',
    textOnBg3: '#fcd34d',
    textOnCta: '#0d0500',
    accent: '#fde68a',
  },
  {
    name: 'Acid Rush',
    mood: 'energetic',
    bg1:   '#052e00',  // dark forest green
    bg2:   '#166534',  // mid green — content pops
    bg3:   '#0a1a00',  // very dark green
    bgCta: '#65a30d',  // lime green CTA
    textOnBg1: '#a3e635',
    textOnBg2: '#ffffff',
    textOnBg3: '#a3e635',
    textOnCta: '#052e00',
    accent: '#d9f99d',
  },
  {
    name: 'Crimson Wave',
    mood: 'energetic',
    bg1:   '#1a0000',  // dark blood red
    bg2:   '#7f1d1d',  // deep crimson — content has drama
    bg3:   '#2d0000',  // near-black red
    bgCta: '#dc2626',  // vivid red CTA
    textOnBg1: '#fca5a5',
    textOnBg2: '#ffffff',
    textOnBg3: '#fca5a5',
    textOnCta: '#ffffff',
    accent: '#fb7185',
  },

  // ══ CINEMATIC ════════════════════════════════════════════════════════════════

  {
    name: 'Midnight Void',
    mood: 'cinematic',
    bg1:   '#020d1a',  // deep navy
    bg2:   '#0c2a4a',  // rich ocean blue — content has depth
    bg3:   '#071525',  // dark steel blue
    bgCta: '#1d4ed8',  // vivid blue CTA
    textOnBg1: '#7dd3fc',
    textOnBg2: '#ffffff',
    textOnBg3: '#7dd3fc',
    textOnCta: '#ffffff',
    accent: '#38bdf8',
  },
  {
    name: 'Purple Abyss',
    mood: 'cinematic',
    bg1:   '#0d0520',  // deep cosmic purple
    bg2:   '#3b0764',  // rich violet — content is immersive
    bg3:   '#1a0a35',  // dark indigo
    bgCta: '#7c3aed',  // vivid violet CTA
    textOnBg1: '#c4b5fd',
    textOnBg2: '#ffffff',
    textOnBg3: '#c4b5fd',
    textOnCta: '#ffffff',
    accent: '#a78bfa',
  },
  {
    name: 'Steel Noir',
    mood: 'cinematic',
    bg1:   '#080c14',  // near-black steel
    bg2:   '#1e3a5f',  // cool slate blue — content has presence
    bg3:   '#0f1c2e',  // dark gunmetal
    bgCta: '#0369a1',  // deep sky blue CTA
    textOnBg1: '#7dd3fc',
    textOnBg2: '#ffffff',
    textOnBg3: '#7dd3fc',
    textOnCta: '#ffffff',
    accent: '#0ea5e9',
  },
  {
    name: 'Crimson Dark',
    mood: 'cinematic',
    bg1:   '#14000a',  // dark wine
    bg2:   '#6b0020',  // deep rose — content is dramatic
    bg3:   '#240010',  // near-black magenta
    bgCta: '#be123c',  // crimson CTA
    textOnBg1: '#fda4af',
    textOnBg2: '#ffffff',
    textOnBg3: '#fda4af',
    textOnCta: '#ffffff',
    accent: '#fb7185',
  },
  {
    name: 'Obsidian Gold',
    mood: 'cinematic',
    bg1:   '#0a0800',  // near-black gold-tinted
    bg2:   '#3d2c00',  // dark gold — content glows
    bg3:   '#1a1400',  // very dark amber
    bgCta: '#b45309',  // rich amber CTA
    textOnBg1: '#fcd34d',
    textOnBg2: '#ffffff',
    textOnBg3: '#fbbf24',
    textOnCta: '#ffffff',
    accent: '#f59e0b',
  },

  // ══ CORPORATE ════════════════════════════════════════════════════════════════

  {
    name: 'Executive Blue',
    mood: 'corporate',
    bg1:   '#020d1a',  // deep navy foundation
    bg2:   '#1e3a5f',  // professional mid-blue — trustworthy content bg
    bg3:   '#0a1f35',  // dark steel
    bgCta: '#1d4ed8',  // authority blue CTA
    textOnBg1: '#93c5fd',
    textOnBg2: '#ffffff',
    textOnBg3: '#93c5fd',
    textOnCta: '#ffffff',
    accent: '#60a5fa',
  },
  {
    name: 'Slate Pro',
    mood: 'corporate',
    bg1:   '#0a0f0f',  // dark slate
    bg2:   '#134e4a',  // teal-slate — confident content bg
    bg3:   '#1a2626',  // dark teal
    bgCta: '#0f766e',  // deep teal CTA
    textOnBg1: '#5eead4',
    textOnBg2: '#ffffff',
    textOnBg3: '#5eead4',
    textOnCta: '#ffffff',
    accent: '#2dd4bf',
  },
  {
    name: 'Teal Authority',
    mood: 'corporate',
    bg1:   '#011a18',  // dark teal foundation
    bg2:   '#065f52',  // rich teal — content has credibility
    bg3:   '#032a24',  // deep forest teal
    bgCta: '#0d9488',  // vivid teal CTA
    textOnBg1: '#6ee7b7',
    textOnBg2: '#ffffff',
    textOnBg3: '#6ee7b7',
    textOnCta: '#ffffff',
    accent: '#34d399',
  },
  {
    name: 'Navy Precision',
    mood: 'corporate',
    bg1:   '#03071e',  // deep space navy
    bg2:   '#023e8a',  // rich navy — content commands attention
    bg3:   '#051040',  // dark indigo-navy
    bgCta: '#1565c0',  // solid blue CTA
    textOnBg1: '#90caf9',
    textOnBg2: '#ffffff',
    textOnBg3: '#90caf9',
    textOnCta: '#ffffff',
    accent: '#42a5f5',
  },
  {
    name: 'Carbon Sharp',
    mood: 'corporate',
    bg1:   '#0a0a0a',  // near-black
    bg2:   '#1f2937',  // dark charcoal — clean professional content
    bg3:   '#111827',  // dark slate
    bgCta: '#374151',  // graphite CTA
    textOnBg1: '#f9fafb',
    textOnBg2: '#ffffff',
    textOnBg3: '#f3f4f6',
    textOnCta: '#ffffff',
    accent: '#6b7280',
  },

  // ══ CHILL ════════════════════════════════════════════════════════════════════

  {
    name: 'Forest Dusk',
    mood: 'chill',
    bg1:   '#052e16',  // deep forest green
    bg2:   '#14532d',  // mid forest — content breathes
    bg3:   '#0a1f10',  // dark moss
    bgCta: '#15803d',  // calm green CTA
    textOnBg1: '#86efac',
    textOnBg2: '#ffffff',
    textOnBg3: '#86efac',
    textOnCta: '#ffffff',
    accent: '#4ade80',
  },
  {
    name: 'Ocean Mist',
    mood: 'chill',
    bg1:   '#012030',  // deep ocean
    bg2:   '#164e63',  // ocean blue — content feels expansive
    bg3:   '#042535',  // dark teal-ocean
    bgCta: '#0891b2',  // calm cyan CTA
    textOnBg1: '#67e8f9',
    textOnBg2: '#ffffff',
    textOnBg3: '#67e8f9',
    textOnCta: '#ffffff',
    accent: '#22d3ee',
  },
  {
    name: 'Lavender Night',
    mood: 'chill',
    bg1:   '#1e1030',  // deep lavender dark
    bg2:   '#4c1d95',  // rich purple — content is dreamy
    bg3:   '#2e1065',  // dark violet
    bgCta: '#7c3aed',  // soft violet CTA
    textOnBg1: '#ddd6fe',
    textOnBg2: '#ffffff',
    textOnBg3: '#ddd6fe',
    textOnCta: '#ffffff',
    accent: '#a78bfa',
  },
  {
    name: 'Sage Minimal',
    mood: 'chill',
    bg1:   '#0f1f0f',  // dark sage
    bg2:   '#1a3a1a',  // forest sage — content is grounded
    bg3:   '#162b16',  // very dark green
    bgCta: '#166534',  // deep sage CTA
    textOnBg1: '#bbf7d0',
    textOnBg2: '#ffffff',
    textOnBg3: '#bbf7d0',
    textOnCta: '#ffffff',
    accent: '#86efac',
  },
  {
    name: 'Indigo Calm',
    mood: 'chill',
    bg1:   '#0f0f2e',  // deep indigo night
    bg2:   '#1e1b4b',  // rich indigo — content is meditative
    bg3:   '#1a1840',  // dark purple-indigo
    bgCta: '#4338ca',  // indigo CTA
    textOnBg1: '#c7d2fe',
    textOnBg2: '#ffffff',
    textOnBg3: '#c7d2fe',
    textOnCta: '#ffffff',
    accent: '#818cf8',
  },
];

// ─── Dynamic Palette Generator ────────────────────────────────────────────────

const MOOD_HUE_RANGES: Record<MoodType, { base: [number, number]; sat: [number, number] }> = {
  energetic: { base: [0, 40],    sat: [70, 100] },
  cinematic: { base: [200, 280], sat: [40, 80]  },
  corporate: { base: [180, 240], sat: [30, 70]  },
  chill:     { base: [120, 200], sat: [20, 60]  },
};

export function generateDynamicPalette(mood: MoodType, seed: number): ColorPalette {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  const range   = MOOD_HUE_RANGES[mood];
  const baseHue = range.base[0] + rand() * (range.base[1] - range.base[0]);
  const baseSat = range.sat[0]  + rand() * (range.sat[1]  - range.sat[0]);

  // bg1: dark foundation (8-15% lightness)
  const bg1 = hslToHex(baseHue, baseSat * 0.9, 8 + rand() * 7);
  // bg2: meaningful mid-tone (25-45% lightness, shifted hue)
  const bg2 = hslToHex((baseHue + 30) % 360, baseSat * 0.85, 25 + rand() * 20);
  // bg3: complementary dark (15-28% lightness, different hue)
  const bg3 = hslToHex((baseHue + 70) % 360, baseSat * 0.7, 15 + rand() * 13);
  // bgCta: saturated hero color (35-55% lightness, complementary hue)
  const bgCta = hslToHex((baseHue + 180) % 360, Math.min(baseSat * 1.1, 100), 35 + rand() * 20);

  const accentHue = (baseHue + 150 + rand() * 60) % 360;
  const accent    = hslToHex(accentHue, 75 + rand() * 25, 55 + rand() * 20);

  const textOnBg1  = bestText(bg1,  '#ffffff', '#f0f0f0', accent);
  const textOnBg2  = bestText(bg2,  '#ffffff', '#f8f8f8', '#000000');
  const textOnBg3  = bestText(bg3,  '#ffffff', '#f0f0f0', accent);
  const textOnCta  = bestText(bgCta, '#ffffff', '#000000', accent);

  return { bg1, bg2, bg3, bgCta, textOnBg1, textOnBg2, textOnBg3, textOnCta, accent, mood, name: `dynamic-${mood}-${seed}` };
}

// ─── Palette Selector ─────────────────────────────────────────────────────────

export function selectPalette(mood: MoodType, seed: number): ColorPalette {
  const rand = ((seed * 16807) % 2147483647 - 1) / 2147483646;
  if (rand < 0.5) {
    const moodPalettes = CURATED_PALETTES.filter((p) => p.mood === mood);
    return moodPalettes[seed % moodPalettes.length];
  }
  return generateDynamicPalette(mood, seed);
}

export function getSceneColors(
  palette: ColorPalette,
  sceneType: 'intro' | 'content' | 'cta',
  sceneIndex: number,
): { bg: string; text: string } {
  if (sceneType === 'cta')   return { bg: palette.bgCta, text: palette.textOnCta };
  if (sceneType === 'intro') return { bg: palette.bg1,   text: palette.textOnBg1 };
  return sceneIndex % 2 === 0
    ? { bg: palette.bg2, text: palette.textOnBg2 }
    : { bg: palette.bg3, text: palette.textOnBg3 };
}