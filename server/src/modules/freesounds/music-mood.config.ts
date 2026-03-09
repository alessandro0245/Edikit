export type MoodType = 'energetic' | 'cinematic' | 'corporate' | 'chill';

export interface MoodSearchConfig {
  queries: string[];         // rotated randomly for variety
  minDuration: number;       // seconds
  maxDuration: number;       // seconds
  tags: string[];            // Freesound tags filter
  license: string[];         // only royalty-friendly licenses
}

export const MOOD_SEARCH_CONFIG: Record<MoodType, MoodSearchConfig> = {
  energetic: {
    queries: [
      'energetic upbeat background music',
      'hype electronic background',
      'powerful driving beat music',
      'fast paced action background',
      'pump up electronic music',
    ],
    minDuration: 30,
    maxDuration: 180,
    tags: ['music', 'background', 'upbeat'],
    license: ['Attribution', 'Attribution Noncommercial', 'Creative Commons 0'],
  },
  cinematic: {
    queries: [
      'cinematic dark ambient background',
      'epic orchestral background music',
      'dramatic film score ambient',
      'dark atmospheric music',
      'mysterious cinematic underscore',
    ],
    minDuration: 30,
    maxDuration: 240,
    tags: ['music', 'cinematic', 'ambient'],
    license: ['Attribution', 'Attribution Noncommercial', 'Creative Commons 0'],
  },
  corporate: {
    queries: [
      'corporate background music professional',
      'clean motivational business music',
      'modern corporate presentation music',
      'positive professional background track',
      'light corporate inspire music',
    ],
    minDuration: 30,
    maxDuration: 180,
    tags: ['music', 'background', 'corporate'],
    license: ['Attribution', 'Attribution Noncommercial', 'Creative Commons 0'],
  },
  chill: {
    queries: [
      'chill ambient background music',
      'relaxed lofi background',
      'calm soft background music',
      'gentle ambient instrumental',
      'peaceful background music soft',
    ],
    minDuration: 30,
    maxDuration: 240,
    tags: ['music', 'ambient', 'chill'],
    license: ['Attribution', 'Attribution Noncommercial', 'Creative Commons 0'],
  },
};