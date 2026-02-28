import { Body, Controller, Post } from '@nestjs/common';
import { VideoService } from './video.service';
import { GeneratePromptDto } from './dto/generate-prompt.dto';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate-prompt')
  generatePrompt(@Body() dto: GeneratePromptDto) {
    return this.videoService.generatePrompt(dto);
  }
}