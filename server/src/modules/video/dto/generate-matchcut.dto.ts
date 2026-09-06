import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class GenerateMatchCutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  word: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  durationInSeconds?: number = 6;

  @IsOptional()
  @IsIn(['16:9', '9:16', '1:1'])
  aspectRatio?: '16:9' | '9:16' | '1:1' = '9:16';

  @IsOptional()
  @IsIn(['1080p', '4k', '4K'])
  resolution?: '1080p' | '4k' | '4K' = '1080p';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  zoomIntensity?: number = 100;
}
