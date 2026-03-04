import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'worker_threads';
import {
  renderMediaOnLambda,
  getRenderProgress,
  RenderProgress,
} from '@remotion/lambda/client';
import { S3Service } from '../s3/s3.service';
import * as path from 'path';
import * as fs from 'fs/promises';

interface VideoConfig {
  title: string;
  scenes: Array<{
    type: 'intro' | 'content' | 'cta';
    text: string;
    subtext?: string;
    backgroundColor: string;
    textColor: string;
    animation: string;
    duration: number;
    fontSize: number;
  }>;
  fps: number;
  width: number;
  height: number;
}

export interface RenderResult {
  renderId?: string;
  bucketName?: string;
  outputPath?: string;
}

export interface RenderProgressResult {
  done: boolean;
  progress: number;
  outputUrl: string | null;
  errors: string[];
  fatalErrorEncountered: boolean;
}

@Injectable()
export class RemotionLambdaService {
  private readonly logger = new Logger(RemotionLambdaService.name);
  private readonly functionName: string;
  private readonly serveUrl: string;
  private readonly region: string;
  private readonly renderMethod: 'local' | 'lambda';
  private readonly remotionDevUrl: string;

  /** In-memory progress tracker for local renders (0-1). Cleaned up on completion. */
  private readonly localProgress = new Map<string, number>();

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    this.functionName = this.configService.get<string>(
      'REMOTION_LAMBDA_FUNCTION_NAME',
      '',
    );
    this.serveUrl = this.configService.get<string>('REMOTION_SERVE_URL', '');
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.renderMethod =
      (this.configService.get<string>('AI_RENDER_METHOD', 'local') as
        | 'local'
        | 'lambda') || 'local';
    this.remotionDevUrl = this.configService.get<string>(
      'REMOTION_DEV_URL',
      'http://localhost:3001',
    );
  }

  /**
   * Render a video either locally or via Lambda.
   */
  async renderVideo(
    config: VideoConfig,
    jobId?: string,
  ): Promise<RenderResult> {
    this.logger.log(
      `Starting ${this.renderMethod} render for "${config.title}" (${config.scenes.length} scenes)`,
    );

    if (this.renderMethod === 'local') {
      return this.renderLocal(config, jobId);
    } else {
      return this.renderLambda(config);
    }
  }

  /** Returns the latest render progress (0-1) for an in-progress local render. */
  getLocalRenderProgress(jobId: string): number {
    return this.localProgress.get(jobId) ?? 0;
  }

  private renderLocal(
    config: VideoConfig,
    jobId?: string,
  ): Promise<RenderResult> {
    const videosDir = path.join(process.cwd(), '../videos');
    const workerScript = path.join(__dirname, 'render.worker.js');

    if (jobId) this.localProgress.set(jobId, 0);

    this.logger.log(
      `Starting local Remotion render (worker thread) for "${config.title}"`,
    );

    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScript, {
        workerData: {
          config: config as unknown as Record<string, unknown>,
          outputDir: videosDir,
          jobId: jobId ?? '',
        },
      });

      worker.on(
        'message',
        (msg: {
          type: string;
          progress?: number;
          outputPath?: string;
          message?: string;
        }) => {
          if (msg.type === 'progress' && jobId) {
            this.localProgress.set(jobId, msg.progress ?? 0);
          } else if (msg.type === 'done') {
            if (jobId) this.localProgress.delete(jobId);
            this.logger.log(`Local render completed: ${msg.outputPath}`);
            resolve({ outputPath: msg.outputPath });
          } else if (msg.type === 'error') {
            if (jobId) this.localProgress.delete(jobId);
            reject(new Error(msg.message));
          }
        },
      );

      worker.on('error', (err) => {
        if (jobId) this.localProgress.delete(jobId);
        this.logger.error(`Render worker error: ${err.message}`);
        reject(err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          if (jobId) this.localProgress.delete(jobId);
          reject(new Error(`Render worker exited with code ${code}`));
        }
      });
    });
  }

  private async renderLambda(config: VideoConfig): Promise<RenderResult> {
    if (!this.functionName || !this.serveUrl) {
      throw new Error(
        'Remotion Lambda not configured: missing REMOTION_LAMBDA_FUNCTION_NAME or REMOTION_SERVE_URL',
      );
    }

    const { renderId, bucketName } = await renderMediaOnLambda({
      region: this.region as any,
      functionName: this.functionName,
      serveUrl: this.serveUrl,
      composition: 'AIVideoComposition',
      inputProps: config as unknown as Record<string, unknown>,
      codec: 'h264',
      maxRetries: 2,
      privacy: 'no-acl',
      downloadBehavior: {
        type: 'download',
        fileName: `${config.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`,
      },
    });

    this.logger.log(
      `Lambda render started: renderId=${renderId}, bucket=${bucketName}`,
    );

    return { renderId, bucketName };
  }

  async getProgress(
    renderId: string,
    bucketName: string,
  ): Promise<RenderProgressResult> {
    if (this.renderMethod === 'local') {
      throw new Error(
        'Progress polling not supported for local renders. Use Lambda for that.',
      );
    }

    const progress: RenderProgress = await getRenderProgress({
      renderId,
      bucketName,
      region: this.region as any,
      functionName: this.functionName,
    });

    const errors: string[] = [];
    if (progress.fatalErrorEncountered) {
      errors.push(progress.errors?.[0]?.message || 'Unknown render error');
    }

    return {
      done: progress.done,
      progress: progress.overallProgress,
      outputUrl: progress.outputFile ?? null,
      errors,
      fatalErrorEncountered: progress.fatalErrorEncountered,
    };
  }

  async downloadAndStoreOutput(
    outputUrl: string,
    jobId: string,
  ): Promise<string> {
    this.logger.log(`Storing output for job ${jobId}`);

    if (this.renderMethod === 'local') {
      if (this.hasS3Configured()) {
        const buffer = await fs.readFile(outputUrl);
        const s3Key = `ai-videos/${jobId}/output.mp4`;
        await this.s3Service.uploadBuffer(buffer, s3Key, 'video/mp4');
        // Clean up the temp render file
        await fs.unlink(outputUrl).catch(() => {});
        this.logger.log(`Uploaded to S3: ${s3Key}`);
        return s3Key;
      } else {
        // Rename the temp file -> <videosDir>/<jobId>.mp4  (no buffer copy)
        const videosDir = path.dirname(outputUrl);
        const finalPath = path.join(videosDir, `${jobId}.mp4`);
        await fs.rename(outputUrl, finalPath);
        this.logger.log(`Stored locally: ${finalPath}`);
        return finalPath;
      }
    } else {
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download render output: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const s3Key = `ai-videos/${jobId}/output.mp4`;
      await this.s3Service.uploadBuffer(buffer, s3Key, 'video/mp4');
      this.logger.log(`Stored rendered video at S3 key: ${s3Key}`);
      return s3Key;
    }
  }

  isLambdaAvailable(): boolean {
    return (
      this.renderMethod === 'lambda' && !!this.functionName && !!this.serveUrl
    );
  }

  private hasS3Configured(): boolean {
    return this.s3Service.isConfigured();
  }

  isLocal(): boolean {
    return this.renderMethod === 'local';
  }
}
