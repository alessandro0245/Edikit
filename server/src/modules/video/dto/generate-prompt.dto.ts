import { IsString, MinLength, MaxLength } from 'class-validator';

export class GeneratePromptDto {
  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(10, { message: 'Prompt must be at least 10 characters' })
  @MaxLength(500, { message: 'Prompt must be at most 500 characters' })
  prompt!: string;
}
