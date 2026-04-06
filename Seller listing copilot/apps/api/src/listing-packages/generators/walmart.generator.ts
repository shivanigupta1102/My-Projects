import { Injectable } from '@nestjs/common';
import { WALMART_BULLET_LIMIT } from '@listingpilot/channel-schemas';
import { Channel } from '@prisma/client';
import {
  CanonicalFacts,
  ChannelGenerator,
  GeneratedChannelPackage,
} from './channel-generator.interface';

const TITLE_MAX = 200;

@Injectable()
export class WalmartGenerator implements ChannelGenerator {
  readonly channel = Channel.WALMART;

  async generate(facts: CanonicalFacts): Promise<GeneratedChannelPackage> {
    const title = this.clip(facts.title ?? 'Untitled', TITLE_MAX);
    const bullets = facts.bullets.slice(0, WALMART_BULLET_LIMIT);

    const attrs = { ...facts.attributes };
    const gtin = attrs['gtin'] || attrs['upc'] || attrs['ean'];
    if (gtin) {
      attrs['gtin'] = String(gtin);
      attrs['productIdType'] = 'GTIN';
    }

    return {
      channel: this.channel,
      title,
      bullets,
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
