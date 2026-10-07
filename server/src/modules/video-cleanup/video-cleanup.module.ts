import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { VideoCleanupService } from './video-cleanup.service';
import { VideoCleanupController } from './video-cleanup.controller';

@Module({
  imports: [PrismaModule, S3Module, ConfigModule],
  controllers: [VideoCleanupController],
  providers: [VideoCleanupService],
  exports: [VideoCleanupService],
})
export class VideoCleanupModule {}
