import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

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
  paletteId?: string; // ← null/undefined = AI picks, string = user's palette choice
}