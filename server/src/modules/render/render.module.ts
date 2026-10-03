import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [HttpModule, CloudinaryModule, PrismaModule, CreditsModule, S3Module],
  controllers: [RenderController],
  providers: [RenderService, RolesGuard],
  exports: [RenderService],
})
export class RenderModule {}
