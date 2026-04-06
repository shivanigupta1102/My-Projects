import { Injectable } from '@nestjs/common';
import { EBAY_TITLE_LIMIT } from '@listingpilot/channel-schemas';
import { Channel } from '@prisma/client';
import {
  CanonicalFacts,
  ChannelGenerator,
  GeneratedChannelPackage,
} from './channel-generator.interface';

@Injectable()
export class EbayGenerator implements ChannelGenerator {
  readonly channel = Channel.EBAY;

  async generate(facts: CanonicalFacts): Promise<GeneratedChannelPackage> {
    const title = this.clip(facts.title ?? 'Untitled', EBAY_TITLE_LIMIT);

    const attrs = { ...facts.attributes };
    const gtin = attrs['gtin'] || attrs['upc'] || attrs['ean'];
    if (gtin) {
      attrs['UPC'] = String(gtin);
    }

    return {
      channel: this.channel,
      title,
      bullets: [],
      description: facts.description,
      attributes: attrs,
      keywords: facts.keywords,
      images: facts.images,
    };
  }

  private clip(s: string, max: number): string {
    return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
  }
}
