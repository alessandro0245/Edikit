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