import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'User email address (Gmail only)',
    example: 'john.doe@gmail.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/i, {
    message: 'Only Gmail addresses (@gmail.com) are allowed',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
