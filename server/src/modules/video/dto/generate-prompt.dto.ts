import {
  IsString, IsNotEmpty, MinLength,
  MaxLength, IsOptional, IsIn,
} from 'class-validator';

export class GeneratePromptDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  prompt!: string;

  @IsOptional()
  @IsString()
  paletteId?: string;

  @IsOptional()
  @IsIn(['energetic', 'cinematic', 'corporate', 'chill', 'none'])
  soundtrackMood?: string; // undefined = auto

  @IsOptional()
  @IsIn(['subtle', 'dynamic', 'intense'])
  animationIntensity?: string; // undefined = dynamic

  @IsOptional()
  @IsIn(['16:9', '9:16', '1:1'])
  aspectRatio?: string; // undefined = 16:9
}