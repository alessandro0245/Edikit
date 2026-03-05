import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);
  constructor(private prisma: PrismaService) {}

  // Get subscription credit limits
  private getCreditLimitForSubscription(planType: string): number {
    const limits = {
      FREE: 5,
      BASIC: 50,
      PRO: 500,
    };
    return limits[planType] || 5;
  }

  // Get user credits (template and AI prompt)
  async getUserCredits(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, aiPromptCredits: true, planType: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }
    const limit = this.getCreditLimitForSubscription(user.planType);
    return {
      templateCredits: user.credits,
      aiPromptCredits: user.aiPromptCredits,
      subscruptionType: user.planType,
      limit,
      canRender: user.credits > 0,
      canUseAiPrompt: user.aiPromptCredits > 0,
    };
  }
  // Check if user has enough credits (template)
  async hasEnoughCredits(userId: string, requiredCredits: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.credits >= requiredCredits;
  }

  // Check if user has enough AI prompt credits
  async hasEnoughAiPromptCredits(userId: string, requiredCredits: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { aiPromptCredits: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.aiPromptCredits >= requiredCredits;
  }
  // Deduct credits from user/render
  async deductCredits(userId: string, amount: number, renderJobId?: string) {
    const hasCredits = await this.hasEnoughCredits(userId, amount);

    if (!hasCredits) {
      throw new BadRequestException('Insufficient credits');
    }

    // Deduct credits and create transaction
    const [user, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'RENDER',
          description: `Used ${amount} credit(s) for video render`,
          renderJobId,
        },
      }),
    ]);

    this.logger.log(
      `Deducted ${amount} credits from user ${userId}. Remaining: ${user.credits}`,
    );

    return {
      remainingCredits: user.credits,
      transaction,
    };
  }

  // Deduct AI prompt credits from user
  async deductAiPromptCredits(userId: string, amount: number, renderJobId?: string) {
    const hasCredits = await this.hasEnoughAiPromptCredits(userId, amount);

    if (!hasCredits) {
      throw new BadRequestException('Insufficient AI prompt credits');
    }

    // Deduct credits and create transaction
    const [user, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          aiPromptCredits: {
            decrement: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'RENDER',
          description: `Used ${amount} AI prompt credit(s) for AI video generation`,
          renderJobId,
        },
      }),
    ]);

    this.logger.log(
      `Deducted ${amount} AI prompt credits from user ${userId}. Remaining: ${user.aiPromptCredits}`,
    );

    return {
      remainingAiPromptCredits: user.aiPromptCredits,
      transaction,
    };
  }
  // refund credits to user (if render fails)
  async refundCredits(userId: string, amount: number, renderJobId?: string) {
    const [user, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'REFUND',
          description: `Refunded ${amount} credit(s) for failed video render`,
          renderJobId,
        },
      }),
    ]);
    this.logger.log(
      `Refunded ${amount} credits to user ${userId}. New balance: ${user.credits}`,
    );
    return {
      newBalance: user.credits,
      transaction,
    };
  }

  // Refund AI prompt credits to user (if render fails)
  async refundAiPromptCredits(userId: string, amount: number, renderJobId?: string) {
    const [user, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          aiPromptCredits: {
            increment: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'REFUND',
          description: `Refunded ${amount} AI prompt credit(s) for failed AI video generation`,
          renderJobId,
        },
      }),
    ]);
    this.logger.log(
      `Refunded ${amount} AI prompt credits to user ${userId}. New balance: ${user.aiPromptCredits}`,
    );
    return {
      newBalance: user.aiPromptCredits,
      transaction,
    };
  }
  // Add credits (for subscription upgrade)
  async addCredits(userId: string, amount: number, description: string) {
    const [user, transaction] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'PURCHASE',
          description: description,
        },
      }),
    ]);
    this.logger.log(
      `Added ${amount} credits to user ${userId}. New balance: ${user.credits}`,
    );
    return {
      newBalance: user.credits,
      transaction,
    };
  }

  // Upgrade subscription and reset credits (both template and AI prompt)
  async upgradeSubscription(
    userId: string,
    newplanType: 'FREE' | 'BASIC' | 'PRO',
  ) {
    const creditLimits = this.getCreditLimitForSubscription(newplanType);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        planType: newplanType,
        credits: creditLimits,
        aiPromptCredits: creditLimits,
      },
    });
    await this.prisma.creditTransaction.create({
      data: {
        userId,
        amount: creditLimits,
        type: 'SUBSCRIPTION',
        description: `Upgraded to ${newplanType} subscription with ${creditLimits} credits (template and AI prompt)`,
      },
    });
    this.logger.log(
      `Upgraded user ${userId} to ${newplanType} subscription with ${creditLimits} template and ${creditLimits} AI prompt credits`,
    );
    return {
      user,
    };
  }
  async getCreditHistory(userId: string) {
    const transactions = await this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return transactions;
  }
}
