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

  constructor(
    private readonly promptService: PromptService,
    private readonly remotionLambdaService: RemotionLambdaService,
    private readonly s3Service: S3Service,
    private readonly creditsService: CreditsService,
    private readonly prisma: PrismaService,
  ) {}

  async generatePrompt(dto: GeneratePromptDto, userId: string) {
    const { prompt, categoryId, paletteId, soundtrackMood, animationIntensity, aspectRatio } = dto;

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
      `User ${userId} | prompt: "${prompt.substring(0, 50)}..." | palette: ${paletteId ?? 'AI'} | soundtrack: ${soundtrackMood ?? 'auto'} | intensity: ${animationIntensity ?? 'dynamic'} | ratio: ${aspectRatio ?? '16:9'}`,
    );

    const videoConfig = await this.promptService.processPrompt(
      prompt,
      categoryId,
      paletteId,
      soundtrackMood,
      animationIntensity,
      aspectRatio,
    );

    const renderJob = await this.prisma.renderJob.create({
      data: {
        userId,
        renderType: 'AI_PROMPT',
        status: 'PENDING',
        promptText: prompt,
        aiConfig: videoConfig as any,
        creditsUsed: VideoService.AI_VIDEO_CREDIT_COST,
      },
    });

    await this.creditsService.deductCredits(
      userId,
      VideoService.AI_VIDEO_CREDIT_COST,
      renderJob.id,
    );

    this.triggerAsyncRender(renderJob.id, userId, videoConfig).catch((err) => {
      this.logger.error(`Async render job ${renderJob.id} failed:`, (err as Error).stack);
    });

    return { jobId: renderJob.id, status: renderJob.status, videoConfig };
  }

  private async triggerAsyncRender(jobId: string, userId: string, videoConfig: any) {
    try {
      await this.prisma.renderJob.update({ where: { id: jobId }, data: { status: 'PROCESSING' } });

      const result = await this.remotionLambdaService.renderVideo(videoConfig, jobId);

      if (result.outputPath) {
        const s3Key = await this.remotionLambdaService.downloadAndStoreOutput(result.outputPath, jobId);
        const hasS3 = this.isS3Available();
        const presignedUrl = hasS3
          ? await this.s3Service.generatePresignedUrl(s3Key)
          : `/video/serve/${jobId}`;

        await this.prisma.renderJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETED', s3OutputKey: s3Key, outputUrl: presignedUrl },
        });
        this.logger.log(`Render completed locally: jobId=${jobId}`);
      } else {
        await this.prisma.renderJob.update({
          where: { id: jobId },
          data: { status: 'PROCESSING', remotionRenderId: result.renderId, remotionBucketName: result.bucketName },
        });
        this.logger.log(`Lambda render queued: jobId=${jobId}, renderId=${result.renderId}`);
      }
    } catch (error) {
      this.logger.error(`Render failed for job ${jobId}`, (error as Error).stack);
      try {
        await this.creditsService.refundCredits(userId, VideoService.AI_VIDEO_CREDIT_COST, jobId);
      } catch (refundErr) {
        this.logger.error('Failed to refund credits', (refundErr as Error).stack);
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
    const job = await this.prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Render job not found');
    if (job.userId !== userId) throw new ForbiddenException('Access denied');

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      return { jobId: job.id, status: job.status, progress: job.status === 'COMPLETED' ? 1 : 0, outputUrl: job.outputUrl, error: job.error, videoConfig: job.aiConfig };
    }

    if (job.status === 'PROCESSING' && !job.remotionRenderId) {
      const progress = this.remotionLambdaService.getLocalRenderProgress(job.id);
      return { jobId: job.id, status: job.status, progress, outputUrl: null, error: null, videoConfig: job.aiConfig };
    }

    if (job.status === 'PROCESSING' && job.remotionRenderId && job.remotionBucketName) {
      try {
        const progress = await this.remotionLambdaService.getProgress(job.remotionRenderId, job.remotionBucketName);

        if (progress.fatalErrorEncountered) {
          await this.creditsService.refundCredits(userId, job.creditsUsed, job.id);
          await this.prisma.renderJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: progress.errors.join('; ') || 'Render failed' } });
          return { jobId: job.id, status: 'FAILED' as RenderStatus, progress: 0, outputUrl: null, error: progress.errors.join('; ') || 'Render failed', videoConfig: job.aiConfig };
        }

        if (progress.done && progress.outputUrl) {
          const s3Key = await this.remotionLambdaService.downloadAndStoreOutput(progress.outputUrl, job.id);
          const presignedUrl = await this.s3Service.generatePresignedUrl(s3Key);
          await this.prisma.renderJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', s3OutputKey: s3Key, outputUrl: presignedUrl } });
          return { jobId: job.id, status: 'COMPLETED' as RenderStatus, progress: 1, outputUrl: presignedUrl, error: null, videoConfig: job.aiConfig };
        }

        return { jobId: job.id, status: 'PROCESSING' as RenderStatus, progress: progress.progress, outputUrl: null, error: null, videoConfig: job.aiConfig };
      } catch (error) {
        this.logger.error(`Error polling progress for job ${job.id}`, (error as Error).stack);
        return { jobId: job.id, status: job.status, progress: 0, outputUrl: null, error: null, videoConfig: job.aiConfig };
      }
    }

    return { jobId: job.id, status: job.status, progress: 0, outputUrl: null, error: null, videoConfig: job.aiConfig };
  }

  async getDownloadUrl(jobId: string, userId: string) {
    const job = await this.prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Render job not found');
    if (job.userId !== userId) throw new ForbiddenException('Access denied');
    if (job.status !== 'COMPLETED' || !job.s3OutputKey) throw new BadRequestException('Video is not ready for download');
    if (!this.isS3Available()) return { downloadUrl: `/video/serve/${job.id}` };
    const presignedUrl = await this.s3Service.generatePresignedUrl(job.s3OutputKey);
    await this.prisma.renderJob.update({ where: { id: job.id }, data: { outputUrl: presignedUrl } });
    return { downloadUrl: presignedUrl };
  }

  async getLocalVideoPath(jobId: string): Promise<string | null> {
    const job = await this.prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!job || !job.s3OutputKey) return null;
    return job.s3OutputKey;
  }
}