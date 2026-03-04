import { GoogleGenAI } from '@google/genai';
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

type AiProvider = 'gemini' | 'copilot';

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly genAI: GoogleGenAI | null = null;
  private readonly modelName: string;
  private readonly provider: AiProvider;
  private readonly copilotBaseUrl: string;
  private readonly maxRetries = 3;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>(
      'AI_PROVIDER',
      'gemini',
    ) as AiProvider;
    this.copilotBaseUrl = this.configService.get<string>(
      'COPILOT_API_URL',
      'http://localhost:4141',
    );

    if (this.provider === 'gemini') {
      const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
      this.genAI = new GoogleGenAI({ apiKey });
      this.modelName = this.configService.get<string>(
        'GEMINI_MODEL',
        'gemini-2.0-flash',
      );
    } else {
      this.modelName = this.configService.get<string>(
        'COPILOT_MODEL',
        'gpt-4.1',
      );
    }

    this.logger.log(
      `PromptService: using provider "${this.provider}" ` +
        (this.provider === 'gemini'
          ? `model "${this.modelName}"`
          : `model "${this.modelName}" via ${this.copilotBaseUrl}`),
    );
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
          `${this.provider} attempt ${attempt}/${this.maxRetries} for prompt: "${prompt.substring(0, 50)}..."`,
        );

        const text =
          this.provider === 'gemini'
            ? await this.callGemini(template.systemPrompt, prompt)
            : await this.callCopilot(template.systemPrompt, prompt);
        if (!text) {
          throw new Error('Empty response from Gemini');
        }

        const config = JSON.parse(text) as VideoConfig;
        this.validateVideoConfig(config);

        this.logger.log(
          `Generated VideoConfig: "${config.title}" with ${config.scenes.length} scenes`,
        );

        return config;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Gemini attempt ${attempt} failed: ${lastError.message}`,
        );

        if (attempt < this.maxRetries) {
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    this.logger.error(
      `All ${this.maxRetries} ${this.provider} attempts failed. Returning fallback config.`,
      lastError?.stack,
    );

    return this.buildFallbackConfig(prompt, categoryId);
  }

  private async callGemini(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const response = await this.genAI!.models.generateContent({
      model: this.modelName,
      contents: `User prompt: "${userPrompt}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  private async callCopilot(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const res = await fetch(`${this.copilotBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dummy',
      },
      body: JSON.stringify({
        model: this.modelName,
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User prompt: "${userPrompt}"` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Copilot API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Copilot API');
    return text;
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
