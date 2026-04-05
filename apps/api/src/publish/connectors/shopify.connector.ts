import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import {
  ChannelConnector,
  PublishConnectorInput,
  PublishConnectorResult,
} from './channel-connector.interface';

@Injectable()
export class ShopifyConnector implements ChannelConnector {
  readonly channel = Channel.SHOPIFY;

  async publish(input: PublishConnectorInput): Promise<PublishConnectorResult> {
    try {
      const admin = await this.callAdminApi(input);
      if (admin) return admin;
    } catch {
      /* mock fallback */
    }
    await this.delay(150);
    return {
      channelListingId: input.dryRun ? 'shopify-dry' : `mock-shopify-${Date.now()}`,
      success: true,
      error: null,
      rawResponse: { productId: 'mock-gid', mode: 'mock-fallback' },
    };
  }

  private async callAdminApi(
    input: PublishConnectorInput,
  ): Promise<PublishConnectorResult | null> {
    if (!input.credentials.accessToken) {
      return null;
    }
    return {
      channelListingId: 'shopify-admin-mock',
      success: true,
      error: null,
      rawResponse: { productId: 'shopify-admin-mock' },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
