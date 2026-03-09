import { Module } from '@nestjs/common';
import { FreesoundService } from './freesound.service';

@Module({
  providers: [FreesoundService],
  exports: [FreesoundService],
})
export class FreesoundModule {}