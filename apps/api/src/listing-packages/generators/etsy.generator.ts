import { Injectable } from '@nestjs/common';
import { ETSY_TITLE_LIMIT } from '@listingpilot/channel-schemas';
import { Channel } from '@prisma/client';
import {
  CanonicalFacts,
  ChannelGenerator,
  GeneratedChannelPackage,
} from './channel-generator.interface';

@Injectable()
export class EtsyGenerator implements ChannelGenerator {
  readonly channel = Channel.ETSY;

  async generate(facts: CanonicalFacts): Promise<GeneratedChannelPackage> {
    const title = this.clip(facts.title ?? 'Untitled', ETSY_TITLE_LIMIT);
    return {
      channel: this.channel,
      title,
      bullets: facts.bullets.slice(0, 13),
      description: facts.description,
      attributes: { ...facts.attributes },
      keywords: facts.keywords,
      images: facts.images,
    };
  }

  private clip(s: string, max: number): string {
    return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
  }
}
