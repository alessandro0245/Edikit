import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getCategoryTemplate } from './prompt-templates/category-templates';

export interface Scene {
  type: 'intro' | 'content' | 'cta';
  text: string;
  subtext?: string;
  backgroundColor: string;
  textColor: string;
  animation:
    | 'fade'
    | 'slide'
    | 'scale'
    | 'typewriter'
    | 'slide-up'
    | 'slide-down';
  duration: number;
  fontSize: number;
}

export interface VideoConfig {
  title: string;
  scenes: Scene[];
  fps: number;
  width: number;
  height: number;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly client: Anthropic;
  private readonly modelName = 'claude-haiku-4-5';
  private readonly maxRetries = 3;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('CLAUDE_API_KEY');
    this.client = new Anthropic({ apiKey });
  }

  async processPrompt(
    prompt: string,
    categoryId: string,
  ): Promise<VideoConfig> {
    const template = getCategoryTemplate(categoryId);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Claude attempt ${attempt}/${this.maxRetries} for prompt: "${prompt.substring(0, 50)}..."`,
        );

        const response = await this.client.messages.create({
          model: this.modelName,
          max_tokens: 2048,
          system: template.systemPrompt,
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

        // Strip any accidental markdown fences before parsing
        const raw = block.text.replace(/```(?:json)?|```/g, '').trim();
        const config = JSON.parse(raw) as VideoConfig;
        this.validateVideoConfig(config);

        this.logger.log(
          `Generated VideoConfig: "${config.title}" with ${config.scenes.length} scenes`,
        );

        return config;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Claude attempt ${attempt} failed: ${lastError.message}`,
        );

        if (attempt < this.maxRetries) {
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    this.logger.error(
      `All ${this.maxRetries} Claude attempts failed. Returning fallback config.`,
      lastError?.stack,
    );

    return this.buildFallbackConfig(prompt, categoryId);
  }

  private validateVideoConfig(config: VideoConfig): void {
    if (!config.title || typeof config.title !== 'string') {
      throw new Error('Invalid VideoConfig: missing or invalid title');
    }

    if (!Array.isArray(config.scenes) || config.scenes.length < 2) {
      throw new Error(
        'Invalid VideoConfig: scenes must be an array with at least 2 scenes',
      );
    }

    const validTypes = ['intro', 'content', 'cta'];
    const validAnimations = [
      'fade',
      'slide',
      'scale',
      'typewriter',
      'slide-up',
      'slide-down',
    ];

    for (const scene of config.scenes) {
      if (!validTypes.includes(scene.type)) {
        throw new Error(`Invalid scene type: ${scene.type}`);
      }
      if (!scene.text || typeof scene.text !== 'string') {
        throw new Error('Invalid scene: missing text');
      }
      if (!validAnimations.includes(scene.animation)) {
        throw new Error(`Invalid animation: ${scene.animation}`);
      }
      if (
        typeof scene.duration !== 'number' ||
        scene.duration < 1 ||
        scene.duration > 10
      ) {
        throw new Error(`Invalid duration: ${scene.duration}`);
      }
      if (!scene.backgroundColor?.match(/^#[0-9a-fA-F]{6}$/)) {
        throw new Error(`Invalid backgroundColor: ${scene.backgroundColor}`);
      }
      if (!scene.textColor?.match(/^#[0-9a-fA-F]{6}$/)) {
        throw new Error(`Invalid textColor: ${scene.textColor}`);
      }
    }

    if (!config.fps || config.fps < 24 || config.fps > 60) {
      config.fps = 30;
    }
    if (!config.width || config.width < 640) {
      config.width = 1920;
    }
    if (!config.height || config.height < 360) {
      config.height = 1080;
    }
  }

  private buildFallbackConfig(prompt: string, categoryId: string): VideoConfig {
    const template = getCategoryTemplate(categoryId);

    return {
      title: 'Generated Video',
      scenes: [
        {
          type: 'intro',
          text: prompt.substring(0, 60),
          backgroundColor: '#1a1a2e',
          textColor: '#ffffff',
          animation: 'fade',
          duration: 3,
          fontSize: 72,
        },
        {
          type: 'content',
          text: prompt.length > 60 ? prompt.substring(60, 140) : prompt,
          subtext: 'AI Generated Content',
          backgroundColor: '#16213e',
          textColor: '#e94560',
          animation: 'slide-up',
          duration: template.defaultDuration,
          fontSize: 64,
        },
        {
          type: 'cta',
          text: 'Thank You',
          subtext: 'Powered by Edikit',
          backgroundColor: '#0f3460',
          textColor: '#ffffff',
          animation: 'scale',
          duration: 3,
          fontSize: 72,
        },
      ],
      fps: 30,
      width: 1920,
      height: 1080,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
