import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'Payment amount in dollars', example: 22 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Product/plan name', example: 'Creator Plan' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Currency code', example: 'usd', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Billing interval', example: 'month', required: false })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiProperty({ description: 'User ID', example: 'usr_123456789' })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
