import { Injectable } from '@nestjs/common';

export interface UrlScrapeResult {
  url: string;
  title: string | null;
  description: string | null;
  keywords: string[];
  ogImage: string | null;
  rawSnippet: string;
}

@Injectable()
export class UrlProcessor {
  async scrape(url: string): Promise<UrlScrapeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ListingPilotBot/1.0',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      const html = await res.text();
      const title = this.matchTag(html, 'title') ?? this.metaContent(html, 'og:title');
      const description =
        this.metaContent(html, 'description') ?? this.metaContent(html, 'og:description');
      const ogImage = this.metaContent(html, 'og:image');
      const keywords = (this.metaContent(html, 'keywords') ?? '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      return {
        url,
        title,
        description,
        keywords,
        ogImage,
        rawSnippet: html.slice(0, 8000),
      };
    } catch {
      return {
        url,
        title: null,
        description: null,
        keywords: [],
        ogImage: null,
        rawSnippet: '',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private matchTag(html: string, tag: string): string | null {
    const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
    const m = re.exec(html);
    return m?.[1]?.trim() ?? null;
  }

  private metaContent(html: string, prop: string): string | null {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
      'i',
    );
    const m = re.exec(html);
    return m?.[1]?.trim() ?? null;
  }
}
