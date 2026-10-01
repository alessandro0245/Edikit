import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { KeepAliveService } from './common/services/keep-alive.service';
import { StripeModule } from './stripe/stripe.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { RenderModule } from './modules/render/render.module';
import { CreditsModule } from './modules/credits/credits.module';
import { VideoModule } from './modules/video/video.module';
import { S3Module } from './modules/s3/s3.module';
import { AssetsModule } from './modules/assets/assets.module';
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 60,
        },
      ],
      errorMessage: 'Too many requests. Try again in 60 seconds',
    }),
    AssetsModule,
    VideoModule,
    ConfigModule,
    PrismaModule,
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
    HttpModule,
    StripeModule,
    CloudinaryModule,
    RenderModule,
    CreditsModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    KeepAliveService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
