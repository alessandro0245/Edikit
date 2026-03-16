import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { VideoService } from './video.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { CURATED_PALETTES } from './color.system';
import * as fs from 'fs';
import * as path from 'path';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate-prompt')
  @UseGuards(JwtAuthGuard)
  generatePrompt(@Body() dto: GeneratePromptDto, @CurrentUser() user: JwtUser) {
    return this.videoService.generatePrompt(dto, user.userId);
  }

  @Get('job/:id')
  @UseGuards(JwtAuthGuard)
  getJobStatus(@Param('id') jobId: string, @CurrentUser() user: JwtUser) {
    return this.videoService.getJobStatus(jobId, user.userId);
  }

  @Post('job/:id/start-render')
  @UseGuards(JwtAuthGuard)
  startRender(
    @Param('id') jobId: string,
    @Body('scenes') scenes: any[],
    @CurrentUser() user: JwtUser,
  ) {
    return this.videoService.startRender(jobId, user.userId, scenes);
  }

  @Get('job/:id/download')
  @UseGuards(JwtAuthGuard)
  getDownloadUrl(@Param('id') jobId: string, @CurrentUser() user: JwtUser) {
    return this.videoService.getDownloadUrl(jobId, user.userId);
  }

  // ── GET /video/palettes ──────────────────────────────────────────────────
  // GET /video/palettes          → all palettes
  // GET /video/palettes?mood=cinematic → filtered by mood
  // No auth required — palettes are public data
  @Get('palettes')
  getPalettes(@Query('mood') mood?: string) {
    const palettes = mood
      ? CURATED_PALETTES.filter((p) => p.mood === mood)
      : CURATED_PALETTES;

    return palettes.map((p) => ({
      id: p.name.toLowerCase().replace(/\s+/g, '-'),
      name: p.name,
      mood: p.mood,
      swatches: {
        bg1:   p.bg1,
        bg2:   p.bg2,
        bg3:   p.bg3,
        bgCta: p.bgCta,
        accent: p.accent,
      },
      textSamples: {
        onBg1: p.textOnBg1,
        onCta: p.textOnCta,
      },
    }));
  }
  // ─────────────────────────────────────────────────────────────────────────

  /** Serve locally-rendered video files (no auth required for video player). */
  @Get('serve/:jobId')
  @Header('Content-Type', 'video/mp4')
  @Header('Accept-Ranges', 'bytes')
  async serveVideo(@Param('jobId') jobId: string, @Res() res: Response) {
    const filePath = await this.videoService.getLocalVideoPath(jobId);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).send('Video not found');
      return;
    }
    const stat = fs.statSync(filePath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${path.basename(filePath)}"`,
    );
    fs.createReadStream(filePath).pipe(res);
  }
}