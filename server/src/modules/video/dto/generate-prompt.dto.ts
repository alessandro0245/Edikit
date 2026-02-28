import { IsString } from "class-validator";

export class GeneratePromptDto {
  @IsString()
  categoryId!: string;

  @IsString()
  prompt!: string;
}