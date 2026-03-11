export type MoodType = 'energetic' | 'cinematic' | 'corporate' | 'chill';
export type SfxType = 'whoosh' | 'tick' | 'pop' | 'swoosh';

export interface AudioConfig {
  mood: MoodType;
  trackUrl: string; // ← resolved URL from Freesound (replaces static trackIndex)
  volume: number;
  sfxVolume: number;
}

// SFX live in remotion/public/sfx/
export function getSfxUrl(sfx: SfxType): string {
  return `/sfx/${sfx}.mp3`;
}

// Which SFX maps to which animation type
export function getAnimationSfx(animation: string): SfxType | null {
  switch (animation) {
    case 'slide':
    case 'slide-up':
    case 'slide-down':
      return 'whoosh';
    case 'typewriter':
      return 'tick';
    case 'scale':
      return 'pop';
    default:
      return null;
  }
}

// ─── Mood Detection ───────────────────────────────────────────────────────────

const ENERGETIC_KEYWORDS = [
  'fitness',
  'sport',
  'energy',
  'power',
  'fast',
  'launch',
  'explosive',
  'action',
  'hype',
  'pump',
  'workout',
  'boost',
  'dynamic',
  'bold',
  'fire',
  'hustle',
  'grind',
  'race',
  'speed',
  'intense',
];

const CINEMATIC_KEYWORDS = [
  'story',
  'film',
  'dark',
  'dystopian',
  'memory',
  'dream',
  'epic',
  'cinematic',
  'mystery',
  'thriller',
  'emotion',
  'journey',
  'war',
  'future',
  'shadow',
  'haunting',
  'legendary',
  'destiny',
  'sacrifice',
];

const CORPORATE_KEYWORDS = [
  'business',
  'company',
  'finance',
  'professional',
  'enterprise',
  'corporate',
  'solution',
  'strategy',
  'growth',
  'invest',
  'revenue',
  'b2b',
  'saas',
  'data',
  'productivity',
  'workflow',
  'efficiency',
  'roi',
  'quarter',
  'team',
];

const CHILL_KEYWORDS = [
  'relax',
  'wellness',
  'calm',
  'nature',
  'minimal',
  'lifestyle',
  'art',
  'creative',
  'ambient',
  'soft',
  'gentle',
  'mindful',
  'peace',
  'yoga',
  'meditate',
  'breathe',
  'slow',
  'cozy',
  'retreat',
  'quiet',
];

const CATEGORY_MOOD_MAP: Record<string, MoodType> = {
  marketing: 'energetic',
  'social-media': 'energetic',
  corporate: 'corporate',
  educational: 'corporate',
  creative: 'cinematic',
  default: 'chill',
};

/**
 * Detects the best mood from prompt + scene text + category.
 * Returns mood only — trackUrl is resolved separately by FreesoundService.
 */
export function detectMood(
  prompt: string,
  scenes: Array<{ text: string; subtext?: string }>,
  categoryId: string,
): MoodType {
  const fullText = [
    prompt,
    ...scenes.map((s) => `${s.text} ${s.subtext ?? ''}`),
  ]
    .join(' ')
    .toLowerCase();

  const scores: Record<MoodType, number> = {
    energetic: 0,
    cinematic: 0,
    corporate: 0,
    chill: 0,
  };

  ENERGETIC_KEYWORDS.forEach((kw) => {
    if (fullText.includes(kw)) scores.energetic += 2;
  });
  CINEMATIC_KEYWORDS.forEach((kw) => {
    if (fullText.includes(kw)) scores.cinematic += 2;
  });
  CORPORATE_KEYWORDS.forEach((kw) => {
    if (fullText.includes(kw)) scores.corporate += 2;
  });
  CHILL_KEYWORDS.forEach((kw) => {
    if (fullText.includes(kw)) scores.chill += 2;
  });

  // Category gives a +3 bonus to its default mood
  const categoryMood = CATEGORY_MOOD_MAP[categoryId] ?? 'chill';
  scores[categoryMood] += 3;

  return (Object.entries(scores) as [MoodType, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
}
