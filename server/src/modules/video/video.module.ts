import {Module} from '@nestjs/common';
import {VideoController} from './video.controller';
import {VideoService} from './video.service';
import {CreditsModule} from '../credits/credits.module';

@Module({
  imports: [CreditsModule],
  controllers: [VideoController],
    providers: [VideoService],
})
export class VideoModule {}