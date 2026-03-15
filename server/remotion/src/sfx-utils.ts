// server/remotion/src/sfx-utils.ts
// Aligned to actual files in remotion/public/sfx/

export type SfxType = 'whoosh' | 'tick' | 'pop' | 'swoosh' | 'impact' | 'rise';
export type AnimationType =
  | 'fade'
  | 'slide'
  | 'slide-up'
  | 'slide-down'
  | 'scale'
  | 'typewriter';

// ─── Pool — every path here EXISTS on disk ────────────────────────────────────
const SFX_POOL: Record<SfxType, string[]> = {
  // whoosh.mp3  whoosh-2.mp3  whoosh-3.mp3  whoosh-4.mp3  whoosh-5.mp3
  whoosh: [
    '/sfx/whoosh.mp3',
    '/sfx/whoosh-2.mp3',
    '/sfx/whoosh-3.mp3',
    '/sfx/whoosh-4.mp3',
    '/sfx/whoosh-5.mp3',
  ],

  // tick.mp3 only — no variants yet
  // TODO: download tick-2.mp3 and tick-3.mp3 from Freesound
  tick: [
    '/sfx/tick.mp3',
    '/sfx/tick.mp3',  // repeats until you add variants
    '/sfx/tick.mp3',
  ],

  // pop.mp3  pop-2.mp3  pop-3.mp3  pop-4.mp3
  pop: [
    '/sfx/pop.mp3',
    '/sfx/pop-2.mp3',
    '/sfx/pop-3.mp3',
    '/sfx/pop-4.mp3',
  ],

  // swoosh.mp3  swoosh-2.mp3  swoosh-3.mp3  swoosh-4.mp3  swoosh-5.mp3
  swoosh: [
    '/sfx/swoosh.mp3',
    '/sfx/swoosh-2.mp3',
    '/sfx/swoosh-3.mp3',
    '/sfx/swoosh-4.mp3',
    '/sfx/swoosh-5.mp3',
  ],

  // impact-1.mp3  impact-2.mp3  impact-3.mp3  impact-4.mp3
  impact: [
    '/sfx/impact-1.mp3',
    '/sfx/impact-2.mp3',
    '/sfx/impact-3.mp3',
    '/sfx/impact-4.mp3',
  ],

  // rise.mp3  rise-1.mp3  rise-2.mp3  rise-3.mp3  rise-4.mp3
  rise: [
    '/sfx/rise.mp3',
    '/sfx/rise-1.mp3',
    '/sfx/rise-2.mp3',
    '/sfx/rise-3.mp3',
    '/sfx/rise-4.mp3',
  ],
};

export function getSfxVariant(sfx: SfxType, sceneIndex: number): string {
  const pool = SFX_POOL[sfx];
  return pool[sceneIndex % pool.length];
}

export function getAnimationSfx(animation: string): SfxType | null {
  switch (animation) {
    case 'slide':
    case 'slide-down':
      return 'whoosh';
    case 'slide-up':
      return 'rise';
    case 'typewriter':
      return 'tick';
    case 'scale':
      return 'pop';
    case 'fade':
    default:
      return null;
  }
}

export function getTransitionSfx(transitionIndex: number): string {
  return getSfxVariant('swoosh', transitionIndex);
}