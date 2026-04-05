import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { BaseMockConnector } from './mock.connector';

@Injectable()
export class EtsyConnector extends BaseMockConnector {
  readonly channel = Channel.ETSY;
}
