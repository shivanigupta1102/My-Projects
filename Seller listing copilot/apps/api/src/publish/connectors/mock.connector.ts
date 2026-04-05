import { Channel } from '@prisma/client';
import {
  ChannelConnector,
  PublishConnectorInput,
  PublishConnectorResult,
} from './channel-connector.interface';

export abstract class BaseMockConnector implements ChannelConnector {
  abstract readonly channel: Channel;

  async publish(input: PublishConnectorInput): Promise<PublishConnectorResult> {
    await this.delay(150 + Math.random() * 120);
    if (input.dryRun) {
      return {
        channelListingId: `mock-${this.channel}-dry`,
        success: true,
        error: null,
        rawResponse: { dryRun: true, channel: this.channel },
      };
    }
    const id = `mock-${this.channel}-${Date.now()}`;
    return {
      channelListingId: id,
      success: true,
      error: null,
      rawResponse: { listingId: id, acknowledged: true },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
