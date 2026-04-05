import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import {
  PublishConnectorInput,
  PublishConnectorResult,
} from './channel-connector.interface';
import { BaseMockConnector } from './mock.connector';

@Injectable()
export class WalmartConnector extends BaseMockConnector {
  readonly channel = Channel.WALMART;

  override async publish(input: PublishConnectorInput): Promise<PublishConnectorResult> {
    await new Promise((r) => setTimeout(r, 200));
    return super.publish(input);
  }
}
