import { Injectable } from '@nestjs/common';
import {
  AMAZON_BULLET_CHAR_LIMIT,
  AMAZON_BULLET_LIMIT,
  AMAZON_TITLE_LIMIT,
} from '@listingpilot/channel-schemas';
import { Channel } from '@prisma/client';
import {
  CanonicalFacts,
  ChannelGenerator,
  GeneratedChannelPackage,
} from './channel-generator.interface';

@Injectable()
export class AmazonGenerator implements ChannelGenerator {
  readonly channel = Channel.AMAZON;

  async generate(facts: CanonicalFacts): Promise<GeneratedChannelPackage> {
    const title = this.clip(facts.title ?? 'Untitled', AMAZON_TITLE_LIMIT);
    const bullets = facts.bullets
      .slice(0, AMAZON_BULLET_LIMIT)
      .map((b) => this.clip(b, AMAZON_BULLET_CHAR_LIMIT));
    return {
      channel: this.channel,
      title,
      bullets,
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
