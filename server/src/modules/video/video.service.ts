import { Injectable } from '@nestjs/common';
import { GeneratePromptDto } from './dto/generate-prompt.dto';

@Injectable()
export class VideoService {
  generatePrompt(dto: GeneratePromptDto) {
    const { categoryId, prompt } = dto;

    return {
      category: categoryId,
      originalPrompt: prompt,
      title: 'AI Generated Video',
      style: 'Cinematic',
      scenes: [
        {
          type: 'intro',
          text: 'Welcome to the Future',
        },
        {
          type: 'main',
          text: prompt,
        },
        {
          type: 'cta',
          text: 'Get Started Today',
        },
      ],
    };
  }
}
