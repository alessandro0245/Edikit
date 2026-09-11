import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getCategoryTemplate,
  generateVisualSeed,
  AnimationIntensity,
  AspectRatio,
} from './prompt-templates/category-templates';
import {
  ColorPalette,
  MoodType,
} from './color.system';

export interface Scene {
  type: 'intro' | 'content' | 'cta';
  text: string;
  subtext?: string;
  backgroundColor: string;
  textColor: string;
  animation: 'fade' | 'slide' | 'scale' | 'typewriter' | 'slide-up' | 'slide-down';
  duration: number;
  fontSize: number;
}

export interface AudioConfig {
  mood: string;
  trackUrl: string;
  volume: number;
  sfxVolume: number;
}

export interface VideoConfig {
  title: string;
  scenes: Scene[];
  fps: number;
  width: number;
  height: number;
  audio?: AudioConfig;
  assets?: {
    bgImageUrl?: string;
    mediaUrls?: string[];
  };
}

/** A single search-result scene for the MatchCut template. */
export interface MatchCutScene {
  siteName: string;
  url: string;
  /** Text that appears BEFORE the pinned word. Must NOT contain the word. */
  titleBefore: string;
  /** Text that appears AFTER the pinned word. Must NOT contain the word. */
  titleAfter: string;
  /** Plain-text description. Should mention the word 1-2 times. */
  snippet: string;
}

// Maps aspect ratio string → pixel dimensions
const DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1':  { width: 1080, height: 1080 },
};

// Maps soundtrackMood user choice → Freesound mood key
// 'none' is handled separately (no track fetched)
const SOUNDTRACK_MOOD_MAP: Record<string, MoodType> = {
  energetic: 'energetic',
  cinematic: 'cinematic',
  corporate: 'corporate',
  chill:     'chill',
};

/**
 * Replicates the buildCuts algorithm from MatchCut.tsx so that the backend
 * requests exactly one scene per cut — no repeats, no wasted tokens.
 *
 * README formula:
 *   const durationInFrames = Math.round(durationInSeconds * FPS);
 *   const rampFrames = Math.min(Math.round(1.2 * FPS), Math.floor(durationInFrames * 0.5));
 *   const sceneCount = buildCuts(durationInFrames, 10, 3, rampFrames).length;
 */
function computeMatchCutSceneCount(durationInSeconds: number): number {
  const FPS = 30;
  const durationInFrames = Math.round(durationInSeconds * FPS);
  const rampFrames = Math.min(
    Math.round(1.2 * FPS),
    Math.floor(durationInFrames * 0.5),
  );
  const holdStart = 10;
  const holdEnd = 3;

  const cuts: number[] = [];
  let f = 0;
  let guard = 0;
  while (f < durationInFrames && guard < 2000) {
    cuts.push(f);
    const t = Math.min(1, f / Math.max(1, rampFrames));
    const hold = Math.max(
      1,
      Math.round(holdStart * Math.pow(holdEnd / holdStart, t)),
    );
    f += hold;
    guard++;
  }
  return cuts.length;
}

/**
 * Validates a single scene against the three README rules:
 *  1. word must NOT appear in titleBefore or titleAfter
 *  2. combined title length ≤ ~40 characters (60 with headroom)
 *  3. required fields must be present and non-empty strings
 */
function validateMatchCutScene(
  scene: unknown,
  word: string,
): scene is MatchCutScene {
  if (!scene || typeof scene !== 'object') return false;
  const s = scene as Record<string, unknown>;

  if (
    typeof s.siteName !== 'string' || !s.siteName.trim() ||
    typeof s.url !== 'string' || !s.url.trim() ||
    typeof s.titleBefore !== 'string' ||
    typeof s.titleAfter !== 'string' ||
    typeof s.snippet !== 'string' || !s.snippet.trim()
  ) return false;

  // Rule 1: word must not appear in the title halves (case-insensitive)
  const lower = word.toLowerCase();
  if (
    s.titleBefore.toLowerCase().includes(lower) ||
    s.titleAfter.toLowerCase().includes(lower)
  ) return false;

  // Rule 2: combined title length must be reasonable (README: ~40 chars)
  const combined = (s.titleBefore + s.titleAfter).replace(/\s+/g, ' ').trim();
  if (combined.length > 60) return false;

  return true;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly client: Anthropic;
  private readonly modelName = 'claude-haiku-4-5';
  private readonly maxRetries = 3;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('CLAUDE_API_KEY');
    this.client = new Anthropic({ apiKey });
  }

  async processPrompt(
    prompt: string,
    categoryId: string,
    backgroundColor: string = '#000000',
    textColor: string = '#ffffff',
    animationIntensity?: string, // 'subtle' | 'dynamic' | 'intense' | undefined (=dynamic)
    aspectRatio?: string,        // '16:9' | '9:16' | '1:1' | undefined (=16:9)
    mediaCount?: number,
  ): Promise<VideoConfig> {
    const template = getCategoryTemplate(categoryId);

    // ── Resolve intensity + ratio with safe defaults ──────────────────────────
    const resolvedIntensity = (animationIntensity as AnimationIntensity) ?? 'dynamic';
    const resolvedRatio     = (aspectRatio as AspectRatio) ?? '16:9';
    const dimensions        = DIMENSIONS[resolvedRatio] ?? DIMENSIONS['16:9'];

    // ── Build custom palette from user colors ──────────────────────────────
    const palette: ColorPalette = {
      name: 'Custom',
      mood: 'corporate', // default mood for custom
      bg1: backgroundColor,
      bg2: backgroundColor,
      bg3: backgroundColor,
      bgCta: backgroundColor,
      textOnBg1: textColor,
      textOnBg2: textColor,
      textOnBg3: textColor,
      textOnCta: textColor,
      accent: textColor,
    };
    
    // ── Detect mood (default to 'energetic' locally if no audio analysis) ──
    const detectedMood: MoodType = 'energetic';
    
    // ── Build seed (now includes intensity + ratio) ───────────────────────────
    const numericSeed = this.numericSeedFromPrompt(prompt);
    
    const seed = generateVisualSeed(
      detectedMood,
      numericSeed,
      palette,
      resolvedIntensity,
      resolvedRatio,
      mediaCount,
    );

    const systemPrompt = template.getSystemPrompt(seed);

    this.logger.debug(
      `Custom Colors | Mood: ${detectedMood} | Intensity: ${resolvedIntensity} | Ratio: ${resolvedRatio}`,
    );

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(`Claude attempt ${attempt}/${this.maxRetries}`);

        const response = await this.client.messages.create({
          model: this.modelName,
          max_tokens: 2048,
          temperature: 1.0,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `User prompt: "${prompt}"\n\nRespond with valid JSON only — no markdown fences, no extra text.`,
            },
          ],
        });

        const block = response.content[0];
        if (!block || block.type !== 'text') throw new Error('Empty response from Claude');

        const raw = block.text.replace(/```(?:json)?|```/g, '').trim();
        const config = JSON.parse(raw) as VideoConfig;

        // Validate colors, enforce correct dimensions
        this.validateAndCorrect(config, palette, dimensions);

        this.logger.log(
          `VideoConfig ready: "${config.title}" | ${config.scenes.length} scenes | ${resolvedRatio}`,
        );

        return config;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
        if (attempt < this.maxRetries) await this.sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    this.logger.error(`All ${this.maxRetries} attempts failed.`, lastError?.stack);
    return this.buildFallbackConfig(prompt, categoryId, detectedMood, palette, dimensions);
  }

  /**
   * Generates scene data for the MatchCut template using the LLM.
   *
   * Enforces the three README rules on every attempt:
   *  1. The word must NOT appear in titleBefore or titleAfter
   *  2. Combined title stays short (~40 chars)
   *  3. snippet should mention the word 1-2 times
   *
   * On JSON/validation failure, retries up to maxRetries before falling back
   * to minimal hardcoded scenes so the render is never left with zero content.
   */
  async generateMatchCutScenes(
    word: string,
    durationInSeconds: number,
  ): Promise<MatchCutScene[]> {
    const sceneCount = computeMatchCutSceneCount(durationInSeconds);

    this.logger.log(
      `Generating ${sceneCount} MatchCut scenes for word="${word}" duration=${durationInSeconds}s`,
    );

    const systemPrompt = this.buildMatchCutSystemPrompt(word, sceneCount);
    const userMessage =
      `Generate exactly ${sceneCount} search result scenes for the word: "${word}"\n\n` +
      `Respond with a JSON array only — no markdown fences, no commentary, no extra keys. Start with [ and end with ].`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `MatchCut scene generation attempt ${attempt}/${this.maxRetries} (${sceneCount} scenes)`,
        );

        const response = await this.client.messages.create({
          model: this.modelName,
          max_tokens: Math.min(8192, sceneCount * 120 + 200), // ~120 tokens/scene
          temperature: 1.0,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const block = response.content[0];
        if (!block || block.type !== 'text') {
          throw new Error('Empty response from Claude');
        }

        // Strip any accidental markdown fences
        const raw = block.text.replace(/```(?:json)?|```/g, '').trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error(`Invalid JSON from Claude: ${raw.substring(0, 200)}`);
        }

        if (!Array.isArray(parsed)) {
          throw new Error('Response is not a JSON array');
        }

        // Validate every scene against the README rules
        const valid: MatchCutScene[] = [];
        const invalid: number[] = [];

        for (let i = 0; i < parsed.length; i++) {
          if (validateMatchCutScene(parsed[i], word)) {
            valid.push(parsed[i] as MatchCutScene);
          } else {
            invalid.push(i);
          }
        }

        // Separate two failure modes:
        //  A) Invalid scenes (word in titles, title too long, missing fields) → retry,
        //     because a broken scene produces a broken frame.
        //  B) Slightly fewer scenes than requested → accept, because the Remotion
        //     component cycles short arrays (README: "safe fallback but visibly
        //     repetitive"). Only retry if below 80% of the target count.
        if (invalid.length > 0) {
          throw new Error(
            `${invalid.length} scene(s) failed validation (indices: ${invalid.join(', ')})`,
          );
        }

        const minAcceptable = Math.floor(sceneCount * 0.8);
        if (valid.length < minAcceptable) {
          throw new Error(
            `Too few scenes: expected ${sceneCount}, got ${valid.length} (minimum ${minAcceptable})`,
          );
        }

        if (valid.length < sceneCount) {
          this.logger.warn(
            `MatchCut: got ${valid.length}/${sceneCount} scenes for "${word}" — ` +
            `component will cycle the last ${sceneCount - valid.length} cut(s).`,
          );
        }

        this.logger.log(
          `MatchCut scenes ready: ${valid.length} scenes for "${word}"`,
        );
        return valid;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `MatchCut scene attempt ${attempt} failed: ${lastError.message}`,
        );
        if (attempt < this.maxRetries) {
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    this.logger.error(
      `All ${this.maxRetries} MatchCut scene attempts failed for "${word}". Using fallback scenes.`,
      lastError?.stack,
    );

    // README: "If fewer scenes are supplied the component cycles them, which is
    // a safe fallback but visibly repetitive." — so we supply enough variety.
    return this.buildMatchCutFallbackScenes(word, sceneCount);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private buildMatchCutSystemPrompt(word: string, sceneCount: number): string {
    return `You generate fake Google-style search result data for a video template called Match Cut.

The template pins the word "${word}" dead-centre on screen. The search result text scrolls around it on every cut.

You must return a JSON array of exactly ${sceneCount} objects. Each object has exactly these five fields:
- "siteName": the name of the source website (e.g. "Britannica", "Reddit", "YouTube")
- "url": a plausible URL breadcrumb (e.g. "https://www.britannica.com > topic > subtopic")
- "titleBefore": text that appears BEFORE the pinned word in the search headline
- "titleAfter": text that appears AFTER the pinned word in the search headline
- "snippet": 1–2 sentence description of the search result

CRITICAL RULES — breaking any of these visually breaks the video:

RULE 1 — WORD EXCLUSION: The word "${word}" MUST NOT appear anywhere in "titleBefore" or "titleAfter". The component inserts it between them automatically. If you write the word in either field it will render twice.

RULE 2 — TITLE LENGTH: The combined length of "titleBefore" and "titleAfter" must be 40 characters or fewer total. Longer titles overflow the frame edges.

RULE 3 — SNIPPET RELEVANCE: "snippet" must mention the word "${word}" exactly 1 or 2 times. It must read as genuine search result text about that topic.

VARIETY: Use a diverse mix of source types across all ${sceneCount} scenes: encyclopedias, news, social media, video, academic, e-commerce, dictionaries, forums, review sites, and so on. Vary titleBefore/titleAfter patterns — some scenes have only a titleBefore, some only titleAfter, some have both.

SPACING: Do not add leading or trailing spaces to titleBefore/titleAfter. The component handles spacing around the word automatically. Exception: apostrophes, quotes, and brackets stay tight against the word — everything else (dashes, pipes, colons) needs a space as part of the surrounding text content.

Output only the JSON array. No markdown. No explanation. No wrapper object.`;
  }

  /**
   * Fallback scene pool — used only if the LLM fails all retries.
   * Contains 10 diverse templates that the component will cycle through.
   * The word is injected into snippets but kept out of title fields.
   */
  private buildMatchCutFallbackScenes(word: string, sceneCount: number): MatchCutScene[] {
    const w = word;
    const templates: MatchCutScene[] = [
      {
        siteName: 'Britannica',
        url: `https://www.britannica.com > topic > ${w.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        titleBefore: '',
        titleAfter: '| Definition, Origins & Facts',
        snippet: `${w} is a concept examined across history and contemporary culture. Learn its origins, significance, and real-world applications.`,
      },
      {
        siteName: 'Wikipedia',
        url: `https://en.wikipedia.org > wiki > ${encodeURIComponent(w)}`,
        titleBefore: '',
        titleAfter: '— Overview & History',
        snippet: `${w} refers to a broadly studied subject with documented historical significance and modern relevance across multiple disciplines.`,
      },
      {
        siteName: 'The Guardian',
        url: 'https://www.theguardian.com > culture > analysis',
        titleBefore: 'Why the world is rethinking',
        titleAfter: '',
        snippet: `An in-depth look at how ${w} became central to modern discourse and what leading thinkers say comes next.`,
      },
      {
        siteName: 'Reddit',
        url: 'https://www.reddit.com > r/discussion > comments',
        titleBefore: 'The hidden side of',
        titleAfter: 'nobody talks about',
        snippet: `Over 1,200 comments on how ${w} shapes everyday decisions. Top answer: "It really comes down to what most people overlook."`,
      },
      {
        siteName: 'YouTube',
        url: 'https://www.youtube.com > watch',
        titleBefore: 'Everything about',
        titleAfter: 'explained in 5 minutes',
        snippet: `4.1M views · 3 weeks ago. A visual explainer covering the rise and significance of ${w} in modern life.`,
      },
      {
        siteName: 'Merriam-Webster',
        url: 'https://www.merriam-webster.com > dictionary',
        titleBefore: '',
        titleAfter: 'Meaning & Etymology',
        snippet: `Definition of ${w}: the core characteristics and practical usage examined in contemporary English usage and recent publications.`,
      },
      {
        siteName: 'Quora',
        url: 'https://www.quora.com > questions',
        titleBefore: 'What exactly makes',
        titleAfter: 'so significant?',
        snippet: `Answered by 47 professionals: when you understand ${w} at its core, the wider picture becomes immediately clear.`,
      },
      {
        siteName: 'Nature',
        url: 'https://www.nature.com > articles > research',
        titleBefore: 'Systemic analysis of',
        titleAfter: 'in modern contexts',
        snippet: `A peer-reviewed study examining the structural impact of ${w} across interconnected domains and long-term societal patterns.`,
      },
      {
        siteName: 'IMDb',
        url: 'https://www.imdb.com > title > spotlight',
        titleBefore: 'The Untold Story of',
        titleAfter: '(Documentary)',
        snippet: `Award-nominated documentary providing unprecedented access into the world, legacy, and lasting impact of ${w}.`,
      },
      {
        siteName: 'Goodreads',
        url: 'https://www.goodreads.com > book > quotes',
        titleBefore: 'Greatest quotes about',
        titleAfter: 'from literature',
        snippet: `Timeless wisdom and essential reflections on ${w} from history's greatest thinkers, authors, and visionaries.`,
      },
    ];

    // Cycle templates to fill the required scene count
    const result: MatchCutScene[] = [];
    for (let i = 0; i < sceneCount; i++) {
      result.push(templates[i % templates.length]);
    }
    return result;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private numericSeedFromPrompt(prompt: string): number {
    return Math.abs(
      prompt.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0) +
      (Date.now() % 10000),
    );
  }

  private validateAndCorrect(
    config: VideoConfig,
    palette: ColorPalette,
    dimensions: { width: number; height: number },
  ): void {
    if (!config.title || typeof config.title !== 'string')
      throw new Error('Invalid VideoConfig: missing title');
    // Allow single scene for specific types, but generally ensure we have scenes
    if (!Array.isArray(config.scenes) || config.scenes.length < 1)
      throw new Error('Invalid VideoConfig: need at least 1 scene');

    const validTypes      = ['intro', 'content', 'cta'];
    const validAnimations = ['fade', 'slide', 'scale', 'typewriter', 'slide-up', 'slide-down'];

    // Removed unused validColors check to avoid build warnings
    // We trust AI output or correct it, but don't want to fail if it picks a slightly off color.

    for (const scene of config.scenes) {
      if (!validTypes.includes(scene.type))      throw new Error(`Invalid scene type: ${scene.type}`);
      if (!scene.text || typeof scene.text !== 'string') throw new Error('Scene missing text');
      if (!validAnimations.includes(scene.animation)) throw new Error(`Invalid animation: ${scene.animation}`);
      if (typeof scene.duration !== 'number' || scene.duration < 1 || scene.duration > 10)
        throw new Error(`Invalid duration: ${scene.duration}`);
    }

    // Always enforce the correct dimensions — Claude may ignore them
    config.fps    = (!config.fps || config.fps < 24 || config.fps > 60) ? 30 : config.fps;
    config.width  = dimensions.width;
    config.height = dimensions.height;
  }

  private buildFallbackConfig(
    prompt: string,
    categoryId: string,
    mood: string,
    palette: ColorPalette,
    dimensions: { width: number; height: number },
  ): VideoConfig {
    const template = getCategoryTemplate(categoryId);
    const scenes: Scene[] = [];

    if (categoryId === 'intro') {
      scenes.push({
        type: 'intro',
        text: prompt.substring(0, 50) || 'WELCOME',
        subtext: 'AI Generated',
        backgroundColor: palette.bg1,
        textColor: palette.textOnBg1,
        animation: 'scale',
        duration: 3,
        fontSize: 90
      });
    } else if (categoryId === 'content') {
      scenes.push({
        type: 'content',
        text: prompt.substring(0, 100) || 'This is your content.',
        subtext: undefined,
        backgroundColor: palette.bg2,
        textColor: palette.textOnBg2,
        animation: 'slide-up',
        duration: 4,
        fontSize: 70
      });
    } else if (categoryId === 'cta') {
      scenes.push({
        type: 'cta',
        text: prompt.substring(0, 50) || 'SUBSCRIBE NOW',
        subtext: 'Join Us',
        backgroundColor: palette.bgCta,
        textColor: palette.textOnCta,
        animation: 'scale',
        duration: 3,
        fontSize: 90
      });
    } else {
      // Original Default / Multi-scene fallback
      scenes.push(
        { type: 'intro',   text: prompt.substring(0, 60), backgroundColor: palette.bg1,   textColor: palette.textOnBg1,  animation: 'fade',     duration: 3,                       fontSize: 80 },
        { type: 'content', text: prompt.length > 60 ? prompt.substring(60, 140) : 'Crafted for you.', subtext: 'AI Generated', backgroundColor: palette.bg2, textColor: palette.textOnBg2, animation: 'slide-up', duration: template.defaultDuration, fontSize: 64 },
        { type: 'cta',     text: 'Get Started Today', subtext: 'Powered by Edikit',        backgroundColor: palette.bgCta, textColor: palette.textOnCta, animation: 'scale',    duration: 3,                       fontSize: 72 },
      );
    }
    
    return {
      title: 'Generated Video',
      scenes,
      fps:    30,
      width:  dimensions.width,
      height: dimensions.height,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}