import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
