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
  CURATED_PALETTES,
  ColorPalette,
  selectPalette,
} from './color.system';
import { FreesoundService } from '../freesounds/freesound.service';
import { detectMood } from '../freesounds/audio-config';
import type { MoodType } from '../freesounds/music-mood.config';

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

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly client: Anthropic;
  private readonly modelName = 'claude-haiku-4-5';
  private readonly maxRetries = 3;

  constructor(
    private readonly configService: ConfigService,
    private readonly freesoundService: FreesoundService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('CLAUDE_API_KEY');
    this.client = new Anthropic({ apiKey });
  }

  async processPrompt(
    prompt: string,
    categoryId: string,
    paletteId?: string,
    soundtrackMood?: string,   // 'energetic' | 'cinematic' | 'corporate' | 'chill' | 'none' | undefined (=auto)
    animationIntensity?: string, // 'subtle' | 'dynamic' | 'intense' | undefined (=dynamic)
    aspectRatio?: string,        // '16:9' | '9:16' | '1:1' | undefined (=16:9)
  ): Promise<VideoConfig> {
    const template = getCategoryTemplate(categoryId);

    // ── Resolve intensity + ratio with safe defaults ──────────────────────────
    const resolvedIntensity = (animationIntensity as AnimationIntensity) ?? 'dynamic';
    const resolvedRatio     = (aspectRatio as AspectRatio) ?? '16:9';
    const dimensions        = DIMENSIONS[resolvedRatio] ?? DIMENSIONS['16:9'];

    // ── Detect mood (used for palette selection + audio) ──────────────────────
    const detectedMood = detectMood(prompt, [], categoryId);

    // ── Resolve audio mood ────────────────────────────────────────────────────
    // Priority: user's explicit choice → detected mood from prompt
    const audioMood: MoodType | 'none' =
      soundtrackMood === 'none' ? 'none'
      : soundtrackMood && SOUNDTRACK_MOOD_MAP[soundtrackMood] ? SOUNDTRACK_MOOD_MAP[soundtrackMood]
      : detectedMood as MoodType;

    // ── Resolve palette ───────────────────────────────────────────────────────
    const numericSeed = this.numericSeedFromPrompt(prompt);
    let palette: ColorPalette;

    if (paletteId) {
      const found = CURATED_PALETTES.find(
        (p) => p.name.toLowerCase().replace(/\s+/g, '-') === paletteId.toLowerCase().trim(),
      );
      if (found) {
        this.logger.log(`Using user-selected palette: "${found.name}"`);
        palette = found;
      } else {
        this.logger.warn(`Palette id "${paletteId}" not found — falling back to AI selection`);
        palette = selectPalette(detectedMood, numericSeed);
      }
    } else {
      palette = selectPalette(detectedMood, numericSeed);
      this.logger.debug(`AI-selected palette: "${palette.name}"`);
    }

    // ── Build seed (now includes intensity + ratio) ───────────────────────────
    const seed = generateVisualSeed(
      detectedMood,
      numericSeed,
      palette,
      resolvedIntensity,
      resolvedRatio,
    );

    const systemPrompt = template.getSystemPrompt(seed);

    this.logger.debug(
      `Palette: "${palette.name}" | Mood: ${detectedMood} | Intensity: ${resolvedIntensity} | Ratio: ${resolvedRatio} | Audio: ${audioMood}`,
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

        // ── Fetch audio track (skip if user chose "none") ─────────────────────
        if (audioMood === 'none') {
          config.audio = undefined;
          this.logger.debug('Soundtrack: none (user disabled music)');
        } else {
          const trackUrl = await this.freesoundService.getTrackUrl(audioMood);
          config.audio = {
            mood:      audioMood,
            trackUrl,
            volume:    0.35,
            sfxVolume: 0.55,
          };
          this.logger.debug(`Soundtrack: "${audioMood}" → ${trackUrl}`);
        }

        this.logger.log(
          `VideoConfig ready: "${config.title}" | ${config.scenes.length} scenes | ${resolvedRatio} | palette: "${palette.name}"`,
        );

        return config;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
        if (attempt < this.maxRetries) await this.sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    this.logger.error(`All ${this.maxRetries} attempts failed.`, lastError?.stack);
    return this.buildFallbackConfig(prompt, categoryId, detectedMood, palette, audioMood, dimensions);
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
    if (!Array.isArray(config.scenes) || config.scenes.length < 2)
      throw new Error('Invalid VideoConfig: need at least 2 scenes');

    const validTypes      = ['intro', 'content', 'cta'];
    const validAnimations = ['fade', 'slide', 'scale', 'typewriter', 'slide-up', 'slide-down'];

    const validColors = new Set(
      [palette.bg1, palette.bg2, palette.bg3, palette.bgCta,
       palette.textOnBg1, palette.textOnBg2, palette.textOnBg3, palette.textOnCta,
       palette.accent].map((c) => c.toLowerCase()),
    );

    for (const scene of config.scenes) {
      if (!validTypes.includes(scene.type))      throw new Error(`Invalid scene type: ${scene.type}`);
      if (!scene.text || typeof scene.text !== 'string') throw new Error('Scene missing text');
      if (!validAnimations.includes(scene.animation)) throw new Error(`Invalid animation: ${scene.animation}`);
      if (typeof scene.duration !== 'number' || scene.duration < 1 || scene.duration > 10)
        throw new Error(`Invalid duration: ${scene.duration}`);
      if (!scene.backgroundColor?.match(/^#[0-9a-fA-F]{6}$/))
        throw new Error(`Invalid backgroundColor: ${scene.backgroundColor}`);
      if (!scene.textColor?.match(/^#[0-9a-fA-F]{6}$/))
        throw new Error(`Invalid textColor: ${scene.textColor}`);

      if (!validColors.has(scene.backgroundColor.toLowerCase())) {
        this.logger.warn(`Off-palette bg "${scene.backgroundColor}" → auto-corrected`);
        scene.backgroundColor =
          scene.type === 'cta' ? palette.bgCta
          : scene.type === 'intro' ? palette.bg1
          : palette.bg2;
      }
      if (!validColors.has(scene.textColor.toLowerCase())) {
        this.logger.warn(`Off-palette text "${scene.textColor}" → auto-corrected`);
        scene.textColor =
          scene.type === 'cta' ? palette.textOnCta
          : scene.type === 'intro' ? palette.textOnBg1
          : palette.textOnBg2;
      }
    }

    // Always enforce the correct dimensions — Claude may ignore them
    config.fps    = (!config.fps || config.fps < 24 || config.fps > 60) ? 30 : config.fps;
    config.width  = dimensions.width;
    config.height = dimensions.height;
  }

  private async buildFallbackConfig(
    prompt: string,
    categoryId: string,
    mood: string,
    palette: ColorPalette,
    audioMood: MoodType | 'none',
    dimensions: { width: number; height: number },
  ): Promise<VideoConfig> {
    const template = getCategoryTemplate(categoryId);

    let audio: AudioConfig | undefined;
    if (audioMood !== 'none') {
      try {
        const trackUrl = await this.freesoundService.getTrackUrl(audioMood);
        audio = { mood: audioMood, trackUrl, volume: 0.35, sfxVolume: 0.55 };
      } catch (_) {
        audio = undefined;
      }
    }

    return {
      title: 'Generated Video',
      scenes: [
        { type: 'intro',   text: prompt.substring(0, 60), backgroundColor: palette.bg1,   textColor: palette.textOnBg1,  animation: 'fade',     duration: 3,                       fontSize: 80 },
        { type: 'content', text: prompt.length > 60 ? prompt.substring(60, 140) : 'Crafted for you.', subtext: 'AI Generated', backgroundColor: palette.bg2, textColor: palette.textOnBg2, animation: 'slide-up', duration: template.defaultDuration, fontSize: 64 },
        { type: 'cta',     text: 'Get Started Today', subtext: 'Powered by Edikit',        backgroundColor: palette.bgCta, textColor: palette.textOnCta, animation: 'scale',    duration: 3,                       fontSize: 72 },
      ],
      fps:    30,
      width:  dimensions.width,
      height: dimensions.height,
      audio,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}