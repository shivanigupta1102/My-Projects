import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import {
  ChannelConnector,
  PublishConnectorInput,
  PublishConnectorResult,
} from './channel-connector.interface';

@Injectable()
export class AmazonConnector implements ChannelConnector {
  readonly channel = Channel.AMAZON;

  async publish(input: PublishConnectorInput): Promise<PublishConnectorResult> {
    try {
      const spApi = await this.callSpApi(input);
      if (spApi) return spApi;
    } catch {
      /* fall through to mock */
    }
    await this.delay(150);
    return {
      channelListingId: input.dryRun ? 'amazon-dry' : `mock-amazon-${Date.now()}`,
      success: true,
      error: null,
      rawResponse: { feedId: 'mock-feed', mode: 'mock-fallback' },
    };
  }

  private async callSpApi(
    input: PublishConnectorInput,
  ): Promise<PublishConnectorResult | null> {
    if (!input.credentials.lwaClientId) {
      return null;
    }
    return {
      channelListingId: 'sp-api-mock',
      success: true,
      error: null,
      rawResponse: { listingId: 'sp-api-mock', source: 'sp-api-mock' },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
