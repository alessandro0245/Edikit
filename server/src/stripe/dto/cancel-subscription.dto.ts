import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'User ID requesting subscription cancellation',
    example: 'usr_123456789',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
