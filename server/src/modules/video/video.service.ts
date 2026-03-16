import { RenderStatus } from '@generated/prisma/enums';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { S3Service } from '../s3/s3.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { PromptService } from './prompt.service';
import { RemotionLambdaService } from './remotion-lambda.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private static readonly AI_VIDEO_CREDIT_COST = 5;
  /** Deduplicates concurrent downloadAndStoreOutput calls for the same job */
  private readonly downloadInProgress = new Map<string, Promise<string>>();

  constructor(
    private readonly promptService: PromptService,
    private readonly remotionLambdaService: RemotionLambdaService,
    private readonly s3Service: S3Service,
    private readonly creditsService: CreditsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── REPLACE only the generatePrompt method in your video.service.ts ─────────
// Everything else (triggerAsyncRender, getJobStatus, etc.) stays exactly the same.

async generatePrompt(dto: GeneratePromptDto, userId: string) {
  const {
    prompt,
    categoryId,
    paletteId,
    soundtrackMood,
    animationIntensity,
    aspectRatio,
    logoUrl,
    bgImageUrl,
    watermarkUrl,
    mediaUrls,
    reviewScenes,
  } = dto;

  const hasCredits = await this.creditsService.hasEnoughCredits(
    userId,
    VideoService.AI_VIDEO_CREDIT_COST,
  );
  if (!hasCredits) {
    throw new BadRequestException(
      'Insufficient credits. Please purchase more credits to generate videos.',
    );
  }

  this.logger.log(
    `User ${userId} | prompt: "${prompt.substring(0, 50)}..." | palette: ${paletteId ?? 'AI'} | soundtrack: ${soundtrackMood ?? 'auto'} | intensity: ${animationIntensity ?? 'dynamic'} | ratio: ${aspectRatio ?? '16:9'} | assets: logo=${!!logoUrl} bg=${!!bgImageUrl} watermark=${!!watermarkUrl} mediaUrlsCount=${mediaUrls?.length ?? 0}`,
  );

  const videoConfig = await this.promptService.processPrompt(
    prompt,
    categoryId,
    paletteId,
    soundtrackMood,
    animationIntensity,
    aspectRatio,
    mediaUrls?.length,
  );

  // ── Attach assets to videoConfig if provided ──────────────────────────────
  if (logoUrl || bgImageUrl || watermarkUrl || (mediaUrls && mediaUrls.length > 0)) {
    videoConfig.assets = {
      ...(logoUrl      && { logoUrl      }),
      ...(bgImageUrl   && { bgImageUrl   }),
      ...(watermarkUrl && { watermarkUrl }),
      ...((mediaUrls && mediaUrls.length > 0) && { mediaUrls }),
    };
  }

  const renderJob = await this.prisma.renderJob.create({
    data: {
      userId,
      renderType:  'AI_PROMPT',
      status:      'PENDING',
      promptText:  prompt,
      aiConfig:    videoConfig as any,
      creditsUsed: VideoService.AI_VIDEO_CREDIT_COST,
    },
  });

  await this.creditsService.deductCredits(
    userId,
    VideoService.AI_VIDEO_CREDIT_COST,
    renderJob.id,
  );

  if (reviewScenes) {
    // Stop here and return the scenes. The frontend will hit /start-render to resume
    return {
      jobId:       renderJob.id,
      status:      renderJob.status,
      videoConfig,
      needsSceneAssignment: true,
    };
  }

  this.triggerAsyncRender(renderJob.id, userId, videoConfig).catch((err) => {
    this.logger.error(
      `Async render job ${renderJob.id} failed:`,
      (err as Error).stack,
    );
  });

  return {
    jobId:       renderJob.id,
    status:      renderJob.status,
    videoConfig,
  };
}

  private async triggerAsyncRender(
    jobId: string,
    userId: string,
    videoConfig: any,
  ) {
    try {
      await this.prisma.renderJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      const result = await this.remotionLambdaService.renderVideo(
        videoConfig,
        jobId,
      );

      if (result.outputPath) {
        const s3Key = await this.remotionLambdaService.downloadAndStoreOutput(
          result.outputPath,
          jobId,
        );
        const hasS3 = this.isS3Available();
        const presignedUrl = hasS3
          ? await this.s3Service.generatePresignedUrl(s3Key)
          : `/video/serve/${jobId}`;

        await this.prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            s3OutputKey: s3Key,
            outputUrl: presignedUrl,
          },
        });
        this.logger.log(`Render completed locally: jobId=${jobId}`);
      } else {
        await this.prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'PROCESSING',
            remotionRenderId: result.renderId,
            remotionBucketName: result.bucketName,
          },
        });
        this.logger.log(
          `Lambda render queued: jobId=${jobId}, renderId=${result.renderId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Render failed for job ${jobId}`,
        (error as Error).stack,
      );
      try {
        await this.creditsService.refundCredits(
          userId,
          VideoService.AI_VIDEO_CREDIT_COST,
          jobId,
        );
      } catch (refundErr) {
        this.logger.error(
          'Failed to refund credits',
          (refundErr as Error).stack,
        );
      }
      await this.prisma.renderJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: (error as Error).message },
      });
    }
  }

  private isS3Available(): boolean {
    return this.s3Service.isConfigured();
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.renderJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Render job not found');
    if (job.userId !== userId) throw new ForbiddenException('Access denied');

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return {
        jobId: job.id,
        status: job.status,
        progress: job.status === 'COMPLETED' ? 1 : 0,
        outputUrl: job.outputUrl,
        error: job.error,
        videoConfig: job.aiConfig,
      };
    }

    if (job.status === 'PROCESSING' && !job.remotionRenderId) {
      const progress = this.remotionLambdaService.getLocalRenderProgress(
        job.id,
      );
      return {
        jobId: job.id,
        status: job.status,
        progress,
        outputUrl: null,
        error: null,
        videoConfig: job.aiConfig,
      };
    }

    if (
      job.status === 'PROCESSING' &&
      job.remotionRenderId &&
      job.remotionBucketName
    ) {
      try {
        const progress = await this.remotionLambdaService.getProgress(
          job.remotionRenderId,
          job.remotionBucketName,
        );

        if (progress.fatalErrorEncountered) {
          await this.creditsService.refundCredits(
            userId,
            job.creditsUsed,
            job.id,
          );
          await this.prisma.renderJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              error: progress.errors.join('; ') || 'Render failed',
            },
          });
          return {
            jobId: job.id,
            status: 'FAILED' as RenderStatus,
            progress: 0,
            outputUrl: null,
            error: progress.errors.join('; ') || 'Render failed',
            videoConfig: job.aiConfig,
          };
        }

        if (progress.done && progress.outputUrl) {
          // Re-check DB first (fast path: already completed by a previous poll)
          const freshJob = await this.prisma.renderJob.findUnique({
            where: { id: job.id },
            select: { status: true, outputUrl: true },
          });
          if (freshJob?.status === 'COMPLETED') {
            return {
              jobId: job.id,
              status: 'COMPLETED' as RenderStatus,
              progress: 1,
              outputUrl: freshJob.outputUrl,
              error: null,
              videoConfig: job.aiConfig,
            };
          }

          // Dedup: reuse an in-flight download promise if one already exists
          if (!this.downloadInProgress.has(job.id)) {
            const dlPromise = this.remotionLambdaService
              .downloadAndStoreOutput(progress.outputUrl, job.id)
              .then(async (s3Key) => {
                const presignedUrl =
                  await this.s3Service.generatePresignedUrl(s3Key);
                await this.prisma.renderJob.update({
                  where: { id: job.id },
                  data: {
                    status: 'COMPLETED',
                    s3OutputKey: s3Key,
                    outputUrl: presignedUrl,
                  },
                });
                return presignedUrl;
              })
              .finally(() => this.downloadInProgress.delete(job.id));
            this.downloadInProgress.set(job.id, dlPromise);
          }

          const presignedUrl = await this.downloadInProgress.get(job.id)!;
          return {
            jobId: job.id,
            status: 'COMPLETED' as RenderStatus,
            progress: 1,
            outputUrl: presignedUrl,
            error: null,
            videoConfig: job.aiConfig,
          };
        }

        return {
          jobId: job.id,
          status: 'PROCESSING' as RenderStatus,
          progress: progress.progress,
          outputUrl: null,
          error: null,
          videoConfig: job.aiConfig,
        };
      } catch (error) {
        const isRateLimit =
          (error as any)?.name === 'TooManyRequestsException' ||
          (error as Error)?.message?.includes('Rate Exceeded');
        if (isRateLimit) {
          this.logger.warn(
            `Lambda rate limit hit for job ${job.id}, backing off`,
          );
        } else {
          this.logger.error(
            `Error polling progress for job ${job.id}`,
            (error as Error).stack,
          );
        }
        return {
          jobId: job.id,
          status: job.status,
          progress: 0,
          outputUrl: null,
          error: null,
          videoConfig: job.aiConfig,
        };
      }
    }

    return {
      jobId: job.id,
      status: job.status,
      progress: 0,
      outputUrl: null,
      error: null,
      videoConfig: job.aiConfig,
    };
  }

  async startRender(jobId: string, userId: string, scenes: any[]) {
    // 1. Find job and ensure it belongs to the user and is still PENDING
    const job = await this.prisma.renderJob.findUnique({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException(`RenderJob not found or unauthorized`);
    }
    if (job.status !== 'PENDING') {
      throw new BadRequestException(`Render job is already ${job.status}`);
    }

    const aiConfig = job.aiConfig as any;
    
    // 2. Overwrite the scenes in the aiConfig
    if (aiConfig && Array.isArray(scenes)) {
      aiConfig.scenes = scenes;
    }

    // 3. Save the new config
    await this.prisma.renderJob.update({
      where: { id: jobId },
      data: { aiConfig },
    });

    // 4. Trigger the background render
    this.triggerAsyncRender(job.id, userId, aiConfig).catch((err) => {
      this.logger.error(
        `Async render job ${job.id} failed:`,
        (err as Error).stack,
      );
    });

    return {
      jobId: job.id,
      status: 'PROCESSING',
      videoConfig: aiConfig,
    };
  }

  async getDownloadUrl(jobId: string, userId: string) {
    const job = await this.prisma.renderJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Render job not found');
    if (job.userId !== userId) throw new ForbiddenException('Access denied');
    if (job.status !== 'COMPLETED' || !job.s3OutputKey)
      throw new BadRequestException('Video is not ready for download');

    if (!this.isS3Available()) return { downloadUrl: `/video/serve/${job.id}` };

    const presignedUrl = await this.s3Service.generatePresignedUrl(
      job.s3OutputKey,
    );
    await this.prisma.renderJob.update({
      where: { id: job.id },
      data: { outputUrl: presignedUrl },
    });
    return { downloadUrl: presignedUrl };
  }

  async getLocalVideoPath(jobId: string): Promise<string | null> {
    const job = await this.prisma.renderJob.findUnique({
      where: { id: jobId },
    });
    if (!job || !job.s3OutputKey) return null;
    return job.s3OutputKey;
  }
}
