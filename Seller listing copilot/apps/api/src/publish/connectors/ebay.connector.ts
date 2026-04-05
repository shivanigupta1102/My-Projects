import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import {
  ChannelConnector,
  PublishConnectorInput,
  PublishConnectorResult,
} from './channel-connector.interface';

@Injectable()
export class EbayConnector implements ChannelConnector {
  readonly channel = Channel.EBAY;

  async publish(input: PublishConnectorInput): Promise<PublishConnectorResult> {
    try {
      const trading = await this.callTradingApi(input);
      if (trading) return trading;
    } catch {
      /* mock fallback */
    }
    await this.delay(150);
    return {
      channelListingId: input.dryRun ? 'ebay-dry' : `mock-ebay-${Date.now()}`,
      success: true,
      error: null,
      rawResponse: { itemId: 'mock-item', mode: 'mock-fallback' },
    };
  }

  private async callTradingApi(
    input: PublishConnectorInput,
  ): Promise<PublishConnectorResult | null> {
    if (!input.credentials.authToken) {
      return null;
    }
    return {
      channelListingId: 'ebay-trading-mock',
      success: true,
      error: null,
      rawResponse: { itemId: 'ebay-trading-mock' },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
