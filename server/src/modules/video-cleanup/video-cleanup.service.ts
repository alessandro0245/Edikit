import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { deleteRender } from '@remotion/lambda/client';
import * as fs from 'fs';

@Injectable()
export class VideoCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VideoCleanupService.name);
  private isCleanupRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Run an initial cleanup sweep when the NestJS application boots up.
   * This immediately clears any videos that expired while the server was offline or restarting.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Running startup sweep for expired videos...');
    await this.handleScheduledCleanup();
  }

  /**
   * Periodic cron job to purge expired videos from AWS storage and database.
   * Runs every 6 hours (4 times daily) to reclaim AWS storage once retention expires.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleScheduledCleanup(): Promise<void> {
    if (this.isCleanupRunning) {
      this.logger.warn('Video cleanup job is already running, skipping this tick.');
      return;
    }

    this.isCleanupRunning = true;
    try {
      this.logger.log('Starting automated video expiration cleanup...');
      const summary = await this.cleanupExpiredVideos();
      this.logger.log(
        `Automated video cleanup completed: ${summary.deletedCount} deleted, ${summary.failedCount} failed across ${summary.batchesProcessed} batch(es).`,
      );
    } catch (error) {
      this.logger.error('Unexpected error during automated video cleanup:', error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Scalable batch processor for expired videos.
   *
   * Guarantees:
   * 1. Safe for existing data: Only queries jobs where `expiresAt IS NOT NULL` and `expiresAt <= NOW()`.
   * 2. Scalable: Uses indexed queries with batching (default 50) and max batch cap to prevent unbounded locks/RAM spikes.
   * 3. Idempotent & Fault-tolerant: Deletion errors on a single job are isolated and don't stop the batch.
   */
  async cleanupExpiredVideos(
    batchSize = 50,
    maxBatches = 20,
  ): Promise<{ deletedCount: number; failedCount: number; batchesProcessed: number }> {
    let deletedCount = 0;
    let failedCount = 0;
    let batchesProcessed = 0;

    const now = new Date();

    while (batchesProcessed < maxBatches) {
      // Find a batch of expired jobs.
      // Crucial: Existing legacy videos have `expiresAt = null`, so they are NEVER matched.
      const expiredJobs = await this.prisma.renderJob.findMany({
        where: {
          expiresAt: {
            not: null,
            lte: now,
          },
        },
        take: batchSize,
        select: {
          id: true,
          userId: true,
          s3OutputKey: true,
          nexrenderOutputUrl: true,
          outputUrl: true,
          remotionRenderId: true,
          remotionBucketName: true,
          expiresAt: true,
        },
      });

      if (expiredJobs.length === 0) {
        break;
      }

      batchesProcessed++;
      this.logger.log(
        `Processing batch ${batchesProcessed} with ${expiredJobs.length} expired videos (cutoff: ${now.toISOString()})...`,
      );

      for (const job of expiredJobs) {
        try {
          await this.deleteExpiredJob(job);
          deletedCount++;
        } catch (jobError) {
          failedCount++;
          this.logger.error(`Failed to cleanup expired job ${job.id}:`, jobError);
          // Continue to next job in batch; one failure does not halt processing
        }
      }

      // If batch had fewer records than batchSize, all matching records have been processed
      if (expiredJobs.length < batchSize) {
        break;
      }
    }

    return { deletedCount, failedCount, batchesProcessed };
  }

  /**
   * Idempotently delete a video's storage assets from AWS (or local filesystem)
   * and subsequently delete the corresponding database record.
   *
   * Idempotency & Safety:
   * - If the AWS file has already been deleted or does not exist, DB deletion still succeeds.
   * - If AWS deletion encounters an unexpected non-404 error (e.g. IAM/Network), DB deletion
   *   is skipped and the error is thrown so the system can retry on the next cron cycle.
   * - If DB deletion fails after AWS deletion, the job remains in DB and retrying on the next
   *   cycle will safely re-delete (S3 delete is idempotent 204) and re-attempt DB deletion.
   */
  async deleteExpiredJob(job: {
    id: string;
    userId: string;
    s3OutputKey: string | null;
    nexrenderOutputUrl: string | null;
    outputUrl: string | null;
    remotionRenderId?: string | null;
    remotionBucketName?: string | null;
  }): Promise<void> {
    const s3KeysToDelete = this.extractS3Keys(job);

    // 1. Delete all AWS S3 storage objects
    if (this.s3Service.isConfigured() && s3KeysToDelete.length > 0) {
      for (const key of s3KeysToDelete) {
        try {
          await this.s3Service.deleteObject(key);
          this.logger.log(`Deleted S3 object [${key}] for expired job ${job.id}`);
        } catch (s3Error: any) {
          // If the S3 file was already deleted, treat as success and proceed
          const isAlreadyDeleted =
            s3Error?.name === 'NoSuchKey' ||
            s3Error?.name === 'NotFound' ||
            s3Error?.$metadata?.httpStatusCode === 404;

          if (isAlreadyDeleted) {
            this.logger.warn(`S3 object [${key}] for job ${job.id} was already deleted or not found.`);
          } else {
            // Transient AWS error (auth failure, network drop, etc.). Rethrow so DB record is not
            // prematurely deleted, allowing automatic retry later.
            this.logger.error(`Error deleting S3 object [${key}] for job ${job.id}:`, s3Error);
            throw s3Error;
          }
        }
      }
    }

    // 2. Clean up Remotion Lambda temporary render artifacts if applicable
    if (job.remotionRenderId && job.remotionBucketName) {
      try {
        const region =
          this.configService.get<string>('REMOTION_AWS_REGION') ||
          this.configService.get<string>('AWS_REGION') ||
          'us-east-1';

        await deleteRender({
          renderId: job.remotionRenderId,
          bucketName: job.remotionBucketName,
          region: region as any,
        });
        this.logger.log(`Cleaned up Remotion lambda render artifacts for job ${job.id}`);
      } catch (remotionErr) {
        // Remotion lambda renders auto-expire via lifecycle; failures here are non-fatal
        this.logger.debug(
          `Remotion lambda render cleanup notice for job ${job.id}: ${
            remotionErr instanceof Error ? remotionErr.message : String(remotionErr)
          }`,
        );
      }
    }

    // 3. Clean up local video file if running in local non-S3 mode
    if (job.s3OutputKey && (job.s3OutputKey.startsWith('/') || job.s3OutputKey.includes('\\'))) {
      try {
        if (fs.existsSync(job.s3OutputKey)) {
          await fs.promises.unlink(job.s3OutputKey);
          this.logger.log(`Deleted local file [${job.s3OutputKey}] for job ${job.id}`);
        }
      } catch (localFileErr) {
        this.logger.warn(`Failed to unlink local video file ${job.s3OutputKey}:`, localFileErr);
      }
    }

    // 4. Delete database record
    await this.prisma.renderJob.delete({
      where: { id: job.id },
    });

    this.logger.log(`Successfully deleted database record for expired job ${job.id}`);
  }

  /**
   * Helper to collect all unique S3 object keys associated with a render job.
   */
  private extractS3Keys(job: {
    s3OutputKey: string | null;
    nexrenderOutputUrl: string | null;
    outputUrl: string | null;
  }): string[] {
    const keys = new Set<string>();

    const checkAndAdd = (val: string | null | undefined) => {
      if (!val) return;
      // Plain S3 key (e.g. renders/user-1/job-2.mp4 or ai-videos/job-3/output.mp4)
      if (
        (val.startsWith('renders/') || val.startsWith('ai-videos/')) &&
        !val.startsWith('http://') &&
        !val.startsWith('https://')
      ) {
        keys.add(val);
        return;
      }

      // S3 URL or presigned URL: extract bucket key
      if (val.includes('.amazonaws.com/')) {
        const afterDomain = val.split('.amazonaws.com/')[1];
        if (afterDomain) {
          const keyOnly = afterDomain.split('?')[0];
          if (keyOnly) {
            keys.add(decodeURIComponent(keyOnly));
          }
        }
      }
    };

    checkAndAdd(job.s3OutputKey);
    checkAndAdd(job.nexrenderOutputUrl);
    checkAndAdd(job.outputUrl);

    return Array.from(keys);
  }
}
