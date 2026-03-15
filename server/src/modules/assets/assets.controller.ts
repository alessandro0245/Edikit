import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService, AssetType } from './assets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // POST /assets/upload
  // multipart/form-data fields:
  //   file       — the image file
  //   assetType  — 'logo' | 'background' | 'watermark'
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB hard limit at multer level
    }),
  )
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body('assetType') assetType: string,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const validTypes: AssetType[] = ['logo', 'background', 'watermark'];
    if (!validTypes.includes(assetType as AssetType)) {
      throw new BadRequestException(
        `Invalid assetType "${assetType}". Must be: logo, background, or watermark.`,
      );
    }

    const result = await this.assetsService.uploadAsset(
      user.userId,
      assetType as AssetType,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      assetType:   result.assetType,
      url:         result.url,
      s3Key:       result.s3Key,
      sizeBytes:   result.sizeBytes,
      contentType: result.contentType,
    };
  }
}