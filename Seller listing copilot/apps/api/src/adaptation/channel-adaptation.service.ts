import { Injectable, Logger } from '@nestjs/common';
import {
  AMAZON_TITLE_LIMIT,
  AMAZON_BULLET_LIMIT,
  AMAZON_BULLET_CHAR_LIMIT,
  AMAZON_BACKEND_KEYWORDS_LIMIT,
  EBAY_TITLE_LIMIT,
  ETSY_TITLE_LIMIT,
  ETSY_TAG_COUNT,
  ETSY_TAG_CHAR_LIMIT,
  SHOPIFY_SEO_TITLE_LIMIT,
  SHOPIFY_SEO_DESCRIPTION_LIMIT,
} from '@listingpilot/channel-schemas';

export interface AdaptedListing {
  channel: string;
  title: string;
  description: string;
  bullets: string[];
  keywords: string[];
  backendKeywords: string[];
  tags: string[];
  itemSpecifics: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  metafields?: Record<string, unknown>;
  adaptationNotes: string[];
}

@Injectable()
export class ChannelAdaptationService {
  private readonly logger = new Logger(ChannelAdaptationService.name);

  async adaptForChannel(
    canonicalProduct: {
      title: string;
      brand: string;
      description: string;
      bullets: string[];
      keywords: string[];
      attributes: Record<string, string>;
    },
    channel: string,
    categoryMapping?: { categoryId: string; itemSpecifics?: Record<string, string> },
  ): Promise<AdaptedListing> {
    this.logger.log(`Adapting product for ${channel}`);

    switch (channel) {
      case 'AMAZON':
        return this.adaptForAmazon(canonicalProduct, categoryMapping);
      case 'EBAY':
        return this.adaptForEbay(canonicalProduct, categoryMapping);
      case 'ETSY':
        return this.adaptForEtsy(canonicalProduct);
      case 'SHOPIFY':
        return this.adaptForShopify(canonicalProduct);
      case 'WALMART':
        return this.adaptForWalmart(canonicalProduct, categoryMapping);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async adaptForAmazon(
    product: { title: string; brand: string; description: string; bullets: string[]; keywords: string[]; attributes: Record<string, string> },
    categoryMapping?: { categoryId: string; itemSpecifics?: Record<string, string> },
  ): Promise<AdaptedListing> {
    const notes: string[] = [];

    // Amazon: keyword-stuffed title respecting byte limit
    let title = product.title;
    if (Buffer.byteLength(title, 'utf8') > AMAZON_TITLE_LIMIT) {
      title = this.truncateToByteLimit(title, AMAZON_TITLE_LIMIT);
      notes.push(`Title truncated to ${AMAZON_TITLE_LIMIT} bytes`);
    }

    // Bullets: starting with capital, no period, benefit-led, max 5
    const bullets = product.bullets.slice(0, AMAZON_BULLET_LIMIT).map(b => {
      let bullet = b.charAt(0).toUpperCase() + b.slice(1);
      if (bullet.endsWith('.')) bullet = bullet.slice(0, -1);
      if (bullet.length > AMAZON_BULLET_CHAR_LIMIT) {
        bullet = bullet.slice(0, AMAZON_BULLET_CHAR_LIMIT - 3) + '...';
      }
      return bullet;
    });

    // Backend keywords: non-overlapping with title
    const titleWords = new Set(title.toLowerCase().split(/\s+/));
    const backendKeywords = product.keywords
      .filter(kw => !titleWords.has(kw.toLowerCase()))
      .join(' ');
    const trimmedBackend = this.truncateToByteLimit(backendKeywords, AMAZON_BACKEND_KEYWORDS_LIMIT);
    if (backendKeywords !== trimmedBackend) {
      notes.push('Backend keywords trimmed for overlap and byte limit');
    }

    // Description as HTML
    const description = `<p>${product.description}</p>`;

    return {
      channel: 'AMAZON',
      title,
      description,
      bullets,
      keywords: product.keywords,
      backendKeywords: [trimmedBackend],
      tags: [],
      itemSpecifics: categoryMapping?.itemSpecifics ?? {},
      adaptationNotes: notes,
    };
  }

  private async adaptForEbay(
    product: { title: string; brand: string; description: string; bullets: string[]; keywords: string[]; attributes: Record<string, string> },
    categoryMapping?: { categoryId: string; itemSpecifics?: Record<string, string> },
  ): Promise<AdaptedListing> {
    const notes: string[] = [];

    // eBay: title frontloaded with highest-search-volume terms within 80 chars
    let title = product.title;
    if (title.length > EBAY_TITLE_LIMIT) {
      title = title.slice(0, EBAY_TITLE_LIMIT);
      notes.push(`Title truncated to ${EBAY_TITLE_LIMIT} characters`);
    }

    return {
      channel: 'EBAY',
      title,
      description: product.description,
      bullets: product.bullets,
      keywords: product.keywords,
      backendKeywords: [],
      tags: [],
      itemSpecifics: categoryMapping?.itemSpecifics ?? {},
      adaptationNotes: notes,
    };
  }

  private async adaptForEtsy(
    product: { title: string; brand: string; description: string; bullets: string[]; keywords: string[]; attributes: Record<string, string> },
  ): Promise<AdaptedListing> {
    const notes: string[] = [];

    // Etsy: natural language title (penalizes keyword-stuffed)
    let title = product.title;
    if (title.length > ETSY_TITLE_LIMIT) {
      title = title.slice(0, ETSY_TITLE_LIMIT);
      notes.push(`Title truncated to ${ETSY_TITLE_LIMIT} characters`);
    }

    // Exactly 13 tags
    let tags = product.keywords
      .map(k => k.slice(0, ETSY_TAG_CHAR_LIMIT))
      .slice(0, ETSY_TAG_COUNT);
    if (tags.length < ETSY_TAG_COUNT) {
      notes.push(`Only ${tags.length} tags available, need ${ETSY_TAG_COUNT}`);
    }

    return {
      channel: 'ETSY',
      title,
      description: product.description,
      bullets: product.bullets,
      keywords: product.keywords,
      backendKeywords: [],
      tags,
      itemSpecifics: {},
      adaptationNotes: notes,
    };
  }

  private async adaptForShopify(
    product: { title: string; brand: string; description: string; bullets: string[]; keywords: string[]; attributes: Record<string, string> },
  ): Promise<AdaptedListing> {
    const notes: string[] = [];

    // HTML description with semantic structure
    const bulletHtml = product.bullets.map(b => `<li>${b}</li>`).join('\n');
    const description = `<div><p>${product.description}</p><ul>${bulletHtml}</ul></div>`;

    // SEO title/description
    let seoTitle = product.title;
    if (seoTitle.length > SHOPIFY_SEO_TITLE_LIMIT) {
      seoTitle = seoTitle.slice(0, SHOPIFY_SEO_TITLE_LIMIT - 3) + '...';
      notes.push('SEO title truncated to 70 chars');
    }

    let seoDescription = product.description.slice(0, SHOPIFY_SEO_DESCRIPTION_LIMIT);
    if (product.description.length > SHOPIFY_SEO_DESCRIPTION_LIMIT) {
      seoDescription = seoDescription.slice(0, -3) + '...';
      notes.push('SEO description truncated to 160 chars');
    }

    return {
      channel: 'SHOPIFY',
      title: product.title,
      description,
      bullets: product.bullets,
      keywords: product.keywords,
      backendKeywords: [],
      tags: product.keywords,
      itemSpecifics: {},
      seoTitle,
      seoDescription,
      metafields: {},
      adaptationNotes: notes,
    };
  }

  private async adaptForWalmart(
    product: { title: string; brand: string; description: string; bullets: string[]; keywords: string[]; attributes: Record<string, string> },
    categoryMapping?: { categoryId: string; itemSpecifics?: Record<string, string> },
  ): Promise<AdaptedListing> {
    const notes: string[] = [];

    let title = product.title;
    if (title.length > 200) {
      title = title.slice(0, 200);
      notes.push('Title truncated to 200 characters');
    }

    const bullets = product.bullets.slice(0, 10);

    return {
      channel: 'WALMART',
      title,
      description: product.description,
      bullets,
      keywords: product.keywords,
      backendKeywords: [],
      tags: [],
      itemSpecifics: categoryMapping?.itemSpecifics ?? {},
      adaptationNotes: notes,
    };
  }

  private truncateToByteLimit(text: string, maxBytes: number): string {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    if (encoded.length <= maxBytes) return text;
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(encoded.slice(0, maxBytes)).replace(/\uFFFD$/, '');
  }
}
