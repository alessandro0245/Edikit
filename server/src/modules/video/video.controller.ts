import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { VideoService } from './video.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate-prompt')
  generatePrompt(@Body() dto: GeneratePromptDto, @CurrentUser() user: JwtUser) {
    return this.videoService.generatePrompt(dto, user.userId);
  }

  @Get('job/:id')
  getJobStatus(@Param('id') jobId: string, @CurrentUser() user: JwtUser) {
    return this.videoService.getJobStatus(jobId, user.userId);
  }

  @Get('job/:id/download')
  getDownloadUrl(@Param('id') jobId: string, @CurrentUser() user: JwtUser) {
    return this.videoService.getDownloadUrl(jobId, user.userId);
  }
}
