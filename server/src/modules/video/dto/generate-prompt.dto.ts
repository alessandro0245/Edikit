import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  IsArray,
  IsBoolean,
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
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsIn(['subtle', 'dynamic', 'intense'])
  animationIntensity?: string;

  @IsOptional()
  @IsIn(['16:9', '9:16', '1:1'])
  aspectRatio?: string;

  @IsOptional()
  @IsString()
  bgImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsBoolean()
  reviewScenes?: boolean;
}