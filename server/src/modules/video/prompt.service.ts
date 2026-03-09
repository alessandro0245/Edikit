import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getCategoryTemplate,
  generateVisualSeed,
  VisualSeed,
} from './prompt-templates/category-templates';
import {
  CURATED_PALETTES,
  ColorPalette,
  selectPalette,
} from './color.system';
import { FreesoundService } from '../freesounds/freesound.service';
import { detectMood } from '../freesounds/audio-config';

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
    paletteId?: string, // ← added
  ): Promise<VideoConfig> {
    const template = getCategoryTemplate(categoryId);
    const mood = detectMood(prompt, [], categoryId);

    // ── Palette resolution ────────────────────────────────────────────────────
    // Priority: user's explicit choice → AI dynamic selection
    let palette: ColorPalette;

    if (paletteId) {
      // Find by id (name slugified: "Acid Rush" → "acid-rush")
      const found = CURATED_PALETTES.find(
        (p) => p.name.toLowerCase().replace(/\s+/g, '-') === paletteId.toLowerCase().trim(),
      );

      if (found) {
        this.logger.log(`Using user-selected palette: "${found.name}"`);
        palette = found;
      } else {
        // paletteId provided but not matched — log and fall back gracefully
        this.logger.warn(
          `Palette id "${paletteId}" not found in CURATED_PALETTES — falling back to AI selection`,
        );
        const numericSeed = this.numericSeedFromPrompt(prompt);
        palette = selectPalette(mood, numericSeed);
      }
    } else {
      // No user choice — AI picks
      const numericSeed = this.numericSeedFromPrompt(prompt);
      palette = selectPalette(mood, numericSeed);
      this.logger.debug(`AI-selected palette: "${palette.name}"`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const numericSeed = this.numericSeedFromPrompt(prompt);
    const seed = generateVisualSeed(mood, numericSeed, palette); // pass resolved palette
    const systemPrompt = template.getSystemPrompt(seed);

    this.logger.debug(
      `Palette: "${palette.name}" | Mood: ${mood} | Motion: ${seed.motionRhythm}`,
    );

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Claude attempt ${attempt}/${this.maxRetries} for: "${prompt.substring(0, 50)}..."`,
        );

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
        if (!block || block.type !== 'text') {
          throw new Error('Empty response from Claude');
        }

        const raw = block.text.replace(/```(?:json)?|```/g, '').trim();
        const config = JSON.parse(raw) as VideoConfig;
        this.validateAndCorrectColors(config, palette);

        const trackUrl = await this.freesoundService.getTrackUrl(mood as any);
        config.audio = { mood, trackUrl, volume: 0.35, sfxVolume: 0.55 };

        this.logger.log(
          `VideoConfig: "${config.title}" | ${config.scenes.length} scenes | palette: "${palette.name}"`,
        );

        return config;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
        if (attempt < this.maxRetries) {
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    this.logger.error(`All ${this.maxRetries} attempts failed.`, lastError?.stack);
    return this.buildFallbackConfig(prompt, categoryId, mood, palette);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private numericSeedFromPrompt(prompt: string): number {
    return Math.abs(
      prompt
        .split('')
        .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0) +
        (Date.now() % 10000),
    );
  }

  private validateAndCorrectColors(config: VideoConfig, palette: ColorPalette): void {
    if (!config.title || typeof config.title !== 'string')
      throw new Error('Invalid VideoConfig: missing title');
    if (!Array.isArray(config.scenes) || config.scenes.length < 2)
      throw new Error('Invalid VideoConfig: need at least 2 scenes');

    const validTypes = ['intro', 'content', 'cta'];
    const validAnimations = ['fade', 'slide', 'scale', 'typewriter', 'slide-up', 'slide-down'];

    const validColors = new Set(
      [
        palette.bg1, palette.bg2, palette.bg3, palette.bgCta,
        palette.textOnBg1, palette.textOnBg2, palette.textOnBg3, palette.textOnCta,
        palette.accent,
      ].map((c) => c.toLowerCase()),
    );

    for (const scene of config.scenes) {
      if (!validTypes.includes(scene.type))
        throw new Error(`Invalid scene type: ${scene.type}`);
      if (!scene.text || typeof scene.text !== 'string')
        throw new Error('Scene missing text');
      if (!validAnimations.includes(scene.animation))
        throw new Error(`Invalid animation: ${scene.animation}`);
      if (typeof scene.duration !== 'number' || scene.duration < 1 || scene.duration > 10)
        throw new Error(`Invalid duration: ${scene.duration}`);
      if (!scene.backgroundColor?.match(/^#[0-9a-fA-F]{6}$/))
        throw new Error(`Invalid backgroundColor: ${scene.backgroundColor}`);
      if (!scene.textColor?.match(/^#[0-9a-fA-F]{6}$/))
        throw new Error(`Invalid textColor: ${scene.textColor}`);

      // Auto-correct any off-palette colors rather than throwing
      if (!validColors.has(scene.backgroundColor.toLowerCase())) {
        this.logger.warn(`Off-palette bg "${scene.backgroundColor}" auto-corrected`);
        scene.backgroundColor =
          scene.type === 'cta'   ? palette.bgCta
          : scene.type === 'intro' ? palette.bg1
          : palette.bg2;
      }
      if (!validColors.has(scene.textColor.toLowerCase())) {
        this.logger.warn(`Off-palette text "${scene.textColor}" auto-corrected`);
        scene.textColor =
          scene.type === 'cta'   ? palette.textOnCta
          : scene.type === 'intro' ? palette.textOnBg1
          : palette.textOnBg2;
      }
    }

    if (!config.fps || config.fps < 24 || config.fps > 60) config.fps = 30;
    if (!config.width || config.width < 640) config.width = 1920;
    if (!config.height || config.height < 360) config.height = 1080;
  }

  private async buildFallbackConfig(
    prompt: string,
    categoryId: string,
    mood: string,
    palette: ColorPalette,
  ): Promise<VideoConfig> {
    const template = getCategoryTemplate(categoryId);

    let trackUrl = '/music/fallback/chill.mp3';
    try {
      trackUrl = await this.freesoundService.getTrackUrl(mood as any);
    } catch (_) {}

    return {
      title: 'Generated Video',
      scenes: [
        { type: 'intro',   text: prompt.substring(0, 60),          backgroundColor: palette.bg1,   textColor: palette.textOnBg1, animation: 'fade',     duration: 3,                      fontSize: 80 },
        { type: 'content', text: prompt.length > 60 ? prompt.substring(60, 140) : 'Crafted for you.', subtext: 'AI Generated', backgroundColor: palette.bg2, textColor: palette.textOnBg2, animation: 'slide-up', duration: template.defaultDuration, fontSize: 64 },
        { type: 'cta',     text: 'Get Started Today', subtext: 'Powered by Edikit', backgroundColor: palette.bgCta, textColor: palette.textOnCta, animation: 'scale', duration: 3, fontSize: 72 },
      ],
      fps: 30, width: 1920, height: 1080,
      audio: { mood, trackUrl, volume: 0.35, sfxVolume: 0.55 },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}