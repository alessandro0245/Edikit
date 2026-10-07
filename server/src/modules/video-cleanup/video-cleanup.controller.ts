import { Controller, Post, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VideoCleanupService } from './video-cleanup.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Video Cleanup')
@Controller('video-cleanup')
export class VideoCleanupController {
  private readonly logger = new Logger(VideoCleanupController.name);

  constructor(private readonly cleanupService: VideoCleanupService) {}

  @Public()
  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger expired video cleanup sweep' })
  @ApiResponse({ status: 200, description: 'Summary of deleted videos' })
  async triggerCleanup() {
    this.logger.log('Manual video cleanup triggered via API endpoint');
    const summary = await this.cleanupService.cleanupExpiredVideos();
    return {
      message: 'Video cleanup completed successfully',
      ...summary,
    };
  }
}
