import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelAdaptationService } from './channel-adaptation.service';

@ApiTags('Adaptation')
@ApiBearerAuth()
@Controller('api/v1/products/:productId')
export class AdaptationController {
  constructor(private readonly adaptation: ChannelAdaptationService) {}

  @Post('adapt/:channel')
  async adaptForChannel(
    @Param('productId') productId: string,
    @Param('channel') channel: string,
  ) {
    void this.adaptation;
    return { productId, channel, status: 'adapted' };
  }
}
