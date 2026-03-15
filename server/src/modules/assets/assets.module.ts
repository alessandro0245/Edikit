import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports:     [S3Module],
  controllers: [AssetsController],
  providers:   [AssetsService],
  exports:     [AssetsService],
})
export class AssetsModule {}