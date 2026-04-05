import { Module } from '@nestjs/common';
import { ChannelAdaptationService } from './channel-adaptation.service';
import { AdaptationController } from './adaptation.controller';

@Module({
  controllers: [AdaptationController],
  providers: [ChannelAdaptationService],
  exports: [ChannelAdaptationService],
})
export class AdaptationModule {}
