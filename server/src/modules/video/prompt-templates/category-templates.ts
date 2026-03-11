import { selectPalette, getSceneColors, ColorPalette, MoodType } from '../color.system';

export interface VisualSeed {
  palette: ColorPalette;
  layoutStyle: string;
  motionRhythm: string;
  typographyMood: string;
  sceneStructure: string;
}

export interface CategoryTemplate {
  getSystemPrompt: (seed: VisualSeed) => string;
  defaultSceneCount: number;
  defaultDuration: number;
}

// ─── Randomness Helpers ───────────────────────────────────────────────────────

const LAYOUT_STYLES = [
  'Bold centered — oversized title dominates the frame, subtext below',
  'Left-anchored — text aligned left with heavy visual weight on the right half',
  'Diagonal split — text flows diagonally across the screen',
  'Bottom-third — text sits low like a broadcast lower-third',
  'Top-heavy — title at top, content expands downward',
  'Full bleed — text fills edge-to-edge with tight padding',
  'Layered depth — primary text large, subtext at 40% opacity behind it',
];

const MOTION_RHYTHMS = [
  'Fast and punchy — short snappy animations, quick cuts, high energy',
  'Slow burn — long fades and eases, cinematic pacing',
  'Elastic bounce — text overshoots and settles, playful feel',
  'Sequential reveal — each word/line appears one after the other',
  'Explosive scale — text scales from 0 to oversized then snaps to final size',
  'Drift — elements slowly float in from off-screen edges',
];

const TYPOGRAPHY_MOODS = [
  'All-caps massive — uppercase, maximum fontSize, commanding presence',
  'Mixed weight — headline heavy, subtext light and airy',
  'Wide spread — generous letter-spacing, premium/luxury feel',
  'Sentence case natural — conversational, approachable',
];

const SCENE_STRUCTURES = [
  'Hook → Tension → Proof → Release → CTA',
  'Question → Answer → Benefit → Social Proof → CTA',
  'Bold Statement → Detail → Detail → Emotional Close → CTA',
  'Problem → Agitate → Solution → CTA',
  'Wow Opener → Context → Payoff → CTA',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── Seed Generator ───────────────────────────────────────────────────────────

export function generateVisualSeed(mood: MoodType, numericSeed: number, resolvedPalette?: ColorPalette): VisualSeed {
  return {
    palette: resolvedPalette ?? selectPalette(mood, numericSeed),
    layoutStyle: pick(LAYOUT_STYLES, numericSeed),
    motionRhythm: pick(MOTION_RHYTHMS, numericSeed + 1),
    typographyMood: pick(TYPOGRAPHY_MOODS, numericSeed + 2),
    sceneStructure: pick(SCENE_STRUCTURES, numericSeed + 3),
  };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(categoryInstructions: string, seed: VisualSeed): string {
  const p = seed.palette;

  return `
You are an expert motion-graphics director. Return ONLY valid JSON — no markdown, no explanation.

SCHEMA:
{
  "title": "string",
  "scenes": [
    {
      "type": "intro" | "content" | "cta",
      "text": "string (max 80 chars)",
      "subtext": "string | undefined (max 120 chars)",
      "backgroundColor": "string (hex)",
      "textColor": "string (hex)",
      "animation": "fade" | "slide" | "scale" | "typewriter" | "slide-up" | "slide-down",
      "duration": number (2-6),
      "fontSize": number (48-96)
    }
  ],
  "fps": 30,
  "width": 1920,
  "height": 1080
}

HARD RULES:
- Exactly ONE intro scene (first), ONE cta scene (last), rest are content.
- Total scenes: 3-7.
- NO two consecutive scenes use the same animation.
- NO two consecutive scenes use the same backgroundColor.
- You MUST use ONLY the exact hex colors listed in the Color Palette below.
- Each scene's textColor MUST be the paired text color for that background (see pairs below).

${categoryInstructions}

═══ COLOR PALETTE: ${p.name} ═══
Use ONLY these exact hex values — no other colors allowed:

Scene backgrounds and their REQUIRED text color pairs:
  Intro scene:          bg="${p.bg1}"  textColor="${p.textOnBg1}"
  Content (even index): bg="${p.bg2}"  textColor="${p.textOnBg2}"
  Content (odd index):  bg="${p.bg3}"  textColor="${p.textOnBg3}"
  CTA scene:            bg="${p.bgCta}" textColor="${p.textOnCta}"
  Accent color (for subtext or highlights): "${p.accent}"

Layout Style: ${seed.layoutStyle}
Motion Rhythm: ${seed.motionRhythm}
Typography Mood: ${seed.typographyMood}
Scene Structure: ${seed.sceneStructure}
═══════════════════════════════
`;
}

// ─── Category Templates ───────────────────────────────────────────────────────

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  marketing: {
    getSystemPrompt: (seed) => buildPrompt(`
CATEGORY: MARKETING / ADVERTISING
- Bold, high-energy animations (scale, slide preferred).
- CTA must have a strong action verb: "Get Started", "Shop Now", "Try Free", "Claim Yours".
- Scene durations: 2-4 seconds.
- Tone: exciting, persuasive, benefit-first.
- Each content scene leads with a distinct value proposition.
- Vary fontSize dramatically (e.g. 96 intro → 64 content → 80 cta).
`, seed),
    defaultSceneCount: 5,
    defaultDuration: 3,
  },

  educational: {
    getSystemPrompt: (seed) => buildPrompt(`
CATEGORY: EDUCATIONAL / EXPLAINER
- Clean, readable animations (fade, typewriter, slide-up).
- Logical flow: introduce topic → explain key points → summarize.
- Durations: 3-5 seconds for readability.
- Tone: clear, informative, approachable.
- Use subtext for definitions or supporting detail.
`, seed),
    defaultSceneCount: 5,
    defaultDuration: 4,
  },

  'social-media': {
    getSystemPrompt: (seed) => buildPrompt(`
CATEGORY: SOCIAL MEDIA
- Fast, attention-grabbing animations (scale, slide, slide-up).
- SHORT: 3-5 scenes, 2-3 seconds each.
- Text large (fontSize 72-96), minimal — never more than 6 words per scene.
- Tone: bold, trendy, scroll-stopping.
- CTA: "Follow", "Share", "Link in Bio", "Save This", "Tag Someone".
`, seed),
    defaultSceneCount: 4,
    defaultDuration: 2.5,
  },

  corporate: {
    getSystemPrompt: (seed) => buildPrompt(`
CATEGORY: CORPORATE / PROFESSIONAL
- Subtle, elegant animations (fade, slide-up).
- Scene structure: problem → solution → benefit → proof → CTA.
- Durations: 3-4 seconds. Measured, authoritative pacing.
- Tone: polished, credible, data-driven.
- Use subtext for statistics or credentials.
`, seed),
    defaultSceneCount: 5,
    defaultDuration: 3.5,
  },

  creative: {
    getSystemPrompt: (seed) => buildPrompt(`
CATEGORY: CREATIVE / ARTISTIC
- Use ALL animation types — mix aggressively for dynamic feel.
- Every scene should feel distinct — no two scenes feel alike.
- Vary durations for rhythm: some 2s, some 5s.
- Tone: imaginative, expressive, avant-garde.
- Subtext can be poetic or abstract.
- fontSize swings: 48 to 96 across scenes.
`, seed),
    defaultSceneCount: 5,
    defaultDuration: 3,
  },

  default: {
    getSystemPrompt: (seed) => buildPrompt(`
CATEGORY: GENERAL
- Balanced mix of animations — no single type more than twice.
- 4-5 scenes, varied durations (2-4 seconds).
- Tone: clear, engaging, adaptable.
`, seed),
    defaultSceneCount: 4,
    defaultDuration: 3,
  },
};

export function getCategoryTemplate(categoryId: string): CategoryTemplate {
  return CATEGORY_TEMPLATES[categoryId] ?? CATEGORY_TEMPLATES['default'];
}

// Re-export for use in prompt.service.ts
export { getSceneColors };
export type { ColorPalette };