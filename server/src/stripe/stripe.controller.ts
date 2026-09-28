import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  UnauthorizedException,
  Query,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { StripeService } from './stripe.service';
import type { RawBodyRequest } from '@nestjs/common';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(JwtAuthGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session for authenticated user' })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCheckoutSession(
    @CurrentUser('userId') userId: string,
    @Body() body: CreateCheckoutSessionDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      return await this.stripeService.payment(
        body.amount,
        body.productName,
        body.currency || 'usd',
        userId,
      );
    } catch (error: any) {
      console.error('Error in createCheckoutSession controller:', error);
      throw new BadRequestException(
        error?.message || 'Unable to create checkout session',
      );
    }
  }

  @Get('verify-session')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Verify completed Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Session verified successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifySession(
    @Query('session_id') sessionId: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    try {
      return await this.stripeService.verifySession(sessionId);
    } catch (error: any) {
      throw new BadRequestException(error?.message || 'Invalid or expired session');
    }
  }

  @Post('cancel-subscription')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Cancel subscription for authenticated user' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(
    @CurrentUser('userId') userId: string,
    @Body() body: CancelSubscriptionDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      return await this.stripeService.cancelSubscription(userId);
    } catch (error: any) {
      console.error('Error in cancelSubscription controller:', error);
      throw new BadRequestException(
        error?.message || 'Unable to cancel subscription',
      );
    }
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook event handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Missing request body');
    }

    try {
      await this.stripeService.handleWebhook(signature, request.rawBody);
      return { received: true };
    } catch (error) {
      const err = error as Error;
      console.error('Webhook error:', err.message);
      throw new BadRequestException('Webhook processing failed');
    }
  }
}
