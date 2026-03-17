import { selectPalette, getSceneColors, ColorPalette, MoodType } from '../color.system';

export type AnimationIntensity = 'subtle' | 'dynamic' | 'intense';
export type AspectRatio        = '16:9' | '9:16' | '1:1';

export interface VisualSeed {
  palette: ColorPalette;
  layoutStyle: string;
  motionRhythm: string;
  typographyMood: string;
  sceneStructure: string;
  animationIntensity: AnimationIntensity;
  aspectRatio: AspectRatio;
  mediaCount?: number;
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

// Animation sets per intensity level
const ANIMATION_RULES: Record<AnimationIntensity, string> = {
  subtle:  'Use ONLY: fade, slide-up. No scale or aggressive motion. Max duration 5s. Smooth, understated transitions.',
  dynamic: 'Use any animation freely: fade, slide, scale, typewriter, slide-up, slide-down. Duration 2-5s. Balanced energy.',
  intense: 'Prefer: scale, slide, slide-down. Use fade sparingly — only on CTA. Min duration 2s, max 3s. Fast, punchy, high-energy cuts.',
};

// Dimensions per aspect ratio
const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1':  { width: 1080, height: 1080 },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── Seed Generator ───────────────────────────────────────────────────────────

export function generateVisualSeed(
  mood: MoodType,
  numericSeed: number,
  resolvedPalette?: ColorPalette,
  animationIntensity: AnimationIntensity = 'dynamic',
  aspectRatio: AspectRatio = '16:9',
  mediaCount?: number,
): VisualSeed {
  return {
    palette:            resolvedPalette ?? selectPalette(mood, numericSeed),
    layoutStyle:        pick(LAYOUT_STYLES,    numericSeed),
    motionRhythm:       pick(MOTION_RHYTHMS,   numericSeed + 1),
    typographyMood:     pick(TYPOGRAPHY_MOODS, numericSeed + 2),
    sceneStructure:     pick(SCENE_STRUCTURES, numericSeed + 3),
    animationIntensity,
    aspectRatio,
    mediaCount,
  };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(categoryInstructions: string, seed: VisualSeed): string {
  const p   = seed.palette;
  const dim = DIMENSIONS[seed.aspectRatio];

  return `
You are an expert motion-graphics director creating kinetic typography videos.
Return ONLY valid JSON — no markdown, no explanation.

SCHEMA:
{
  "title": "string",
  "scenes": [
    {
      "type": "intro" | "content" | "cta",
      "text": "string",
      "subtext": "string | undefined",
      "backgroundColor": "string (hex)",
      "textColor": "string (hex)",
      "animation": "fade" | "slide" | "scale" | "typewriter" | "slide-up" | "slide-down",
      "duration": number,
      "fontSize": number
    }
  ],
  "fps": 30,
  "width": ${dim.width},
  "height": ${dim.height}
}

══════════════════════════════════════════════════
INTRO SCENE RULES (type: "intro"):
- Style: KINETIC BLOCK REVEAL — short, punchy, bold
- text: Use pipe | to split into 2 lines. MAX 3 words per line. ALL CAPS.
  Example: "MEET YOUR|NEW EDITOR" or "INTRODUCING|EDIKIT AI"
- subtext: ONE punchy line, max 5 words, all caps
- backgroundColor: "#050505"
- textColor: "${p.accent}" ← this becomes the first block color
- duration: 2-2.5 seconds
- fontSize: 80-96
- animation: "slide" or "scale"

CONTENT SCENE RULES (type: "content"):
- Style: CLASSIC — readable, breathing room, informative
- text: Normal sentence, max 60 chars. Can be mixed case.
- subtext: Supporting detail, max 100 chars
- backgroundColor: use alternating "${p.bg2}" and "${p.bg3}"
- textColor: "${p.textOnBg2}" or "${p.textOnBg3}" matching the bg
- duration: 3-5 seconds (enough to read)
- fontSize: 60-72
- animation: "fade", "slide-up", "typewriter", or "slide"

CTA SCENE RULES (type: "cta"):
- Style: KINETIC BLOCK REVEAL — maximum energy, drive action
- text: Use pipe | to split into 2 lines. SHORT action phrase. ALL CAPS.
  Example: "START NOW|IT'S FREE" or "JOIN TODAY|GET STARTED"
- subtext: Brand tagline or URL, short
- backgroundColor: "#050505"
- textColor: "${p.bgCta}" ← vivid CTA color as block color
- duration: 2-3 seconds
- fontSize: 80-96
- animation: "scale" or "slide"
══════════════════════════════════════════════════

HARD RULES:
- Exactly ONE intro (first scene), ONE cta (last scene), rest are content
- Total scenes: ${seed.mediaCount ? seed.mediaCount + 2 : '4-7'}
- NO two consecutive content scenes use the same backgroundColor
- Content textColor MUST be the correct pair for its backgroundColor
- Output width MUST be ${dim.width}, height MUST be ${dim.height}

${categoryInstructions}

═══ ANIMATION INTENSITY: ${seed.animationIntensity.toUpperCase()} ═══
${
  seed.animationIntensity === 'subtle'
    ? 'Content: prefer fade and slide-up. Calm pacing.'
    : seed.animationIntensity === 'intense'
    ? 'Content: prefer slide, scale, slide-down. Fast durations (2.5-3.5s).'
    : 'Content: mix of fade, slide-up, typewriter. Balanced (3-4s).'
}

═══ VISUAL DIRECTION ═══
Layout:    ${seed.layoutStyle}
Motion:    ${seed.motionRhythm}
Structure: ${seed.sceneStructure}
Ratio:     ${seed.aspectRatio} (${dim.width}×${dim.height})
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

export { getSceneColors };
export type { ColorPalette };