import { Channel } from '@prisma/client';

export interface PublishConnectorInput {
  channelId: string;
  externalId: string | null;
  credentials: Record<string, unknown>;
  listingPayload: Record<string, unknown>;
  dryRun: boolean;
}

export interface PublishConnectorResult {
  channelListingId: string | null;
  success: boolean;
  error: string | null;
  rawResponse: Record<string, unknown>;
}

export interface ChannelConnector {
  readonly channel: Channel;
  publish(input: PublishConnectorInput): Promise<PublishConnectorResult>;
}
