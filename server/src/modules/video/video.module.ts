import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { PromptService } from './prompt.service';
import { RemotionLambdaService } from './remotion-lambda.service';
import { CreditsModule } from '../credits/credits.module';
import { S3Module } from '../s3/s3.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [CreditsModule, S3Module, PrismaModule],
  controllers: [VideoController],
  providers: [VideoService, PromptService, RemotionLambdaService],
})
export class VideoModule {}