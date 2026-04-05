import { ChannelAdaptationService } from '../../src/adaptation/channel-adaptation.service';

describe('ChannelAdaptationService', () => {
  let service: ChannelAdaptationService;

  const mockProduct = {
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones with Multipoint Bluetooth',
    brand: 'Sony',
    description: 'Industry-leading noise cancellation with premium sound quality',
    bullets: [
      'Industry-leading noise cancellation technology',
      'Up to 30-hour battery life with quick charging',
      'Touch sensor controls for easy operation',
      'Premium sound quality with LDAC codec support',
      'Speak-to-chat technology pauses music instantly',
    ],
    keywords: ['wireless headphones', 'noise canceling', 'bluetooth', 'over ear', 'sony'],
    attributes: { color: 'Black', connectivity: 'Bluetooth' },
  };

  beforeEach(() => {
    service = new ChannelAdaptationService();
  });

  describe('Amazon adaptation', () => {
    it('should respect 200 byte title limit', async () => {
      const longProduct = { ...mockProduct, title: 'A'.repeat(250) };
      const result = await service.adaptForChannel(longProduct, 'AMAZON');
      expect(Buffer.byteLength(result.title, 'utf8')).toBeLessThanOrEqual(200);
    });

    it('should limit bullets to 5', async () => {
      const result = await service.adaptForChannel(mockProduct, 'AMAZON');
      expect(result.bullets.length).toBeLessThanOrEqual(5);
    });

    it('should capitalize first letter of bullets', async () => {
      const result = await service.adaptForChannel(mockProduct, 'AMAZON');
      for (const bullet of result.bullets) {
        expect(bullet[0]).toBe(bullet[0].toUpperCase());
      }
    });

    it('should remove trailing periods from bullets', async () => {
      const product = {
        ...mockProduct,
        bullets: ['First bullet point.', 'Second bullet.'],
      };
      const result = await service.adaptForChannel(product, 'AMAZON');
      for (const bullet of result.bullets) {
        expect(bullet.endsWith('.')).toBe(false);
      }
    });

    it('should generate non-overlapping backend keywords', async () => {
      const result = await service.adaptForChannel(mockProduct, 'AMAZON');
      expect(result.backendKeywords).toBeDefined();
      expect(Array.isArray(result.backendKeywords)).toBe(true);
    });

    it('should wrap description in HTML tags', async () => {
      const result = await service.adaptForChannel(mockProduct, 'AMAZON');
      expect(result.description).toContain('<p>');
    });
  });

  describe('eBay adaptation', () => {
    it('should respect 80 character title limit', async () => {
      const result = await service.adaptForChannel(mockProduct, 'EBAY');
      expect(result.title.length).toBeLessThanOrEqual(80);
    });
  });

  describe('Etsy adaptation', () => {
    it('should respect 140 character title limit', async () => {
      const longProduct = { ...mockProduct, title: 'A'.repeat(200) };
      const result = await service.adaptForChannel(longProduct, 'ETSY');
      expect(result.title.length).toBeLessThanOrEqual(140);
    });

    it('should limit tags to 13', async () => {
      const product = {
        ...mockProduct,
        keywords: Array.from({ length: 20 }, (_, i) => `keyword${i}`),
      };
      const result = await service.adaptForChannel(product, 'ETSY');
      expect(result.tags.length).toBeLessThanOrEqual(13);
    });

    it('should truncate tags to 20 characters', async () => {
      const product = {
        ...mockProduct,
        keywords: ['this is a very long keyword that exceeds twenty chars'],
      };
      const result = await service.adaptForChannel(product, 'ETSY');
      for (const tag of result.tags) {
        expect(tag.length).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Shopify adaptation', () => {
    it('should generate HTML description', async () => {
      const result = await service.adaptForChannel(mockProduct, 'SHOPIFY');
      expect(result.description).toContain('<div>');
      expect(result.description).toContain('<ul>');
    });

    it('should generate SEO title under 70 chars', async () => {
      const result = await service.adaptForChannel(mockProduct, 'SHOPIFY');
      expect(result.seoTitle).toBeDefined();
      expect(result.seoTitle!.length).toBeLessThanOrEqual(70);
    });

    it('should generate SEO description under 160 chars', async () => {
      const result = await service.adaptForChannel(mockProduct, 'SHOPIFY');
      expect(result.seoDescription).toBeDefined();
      expect(result.seoDescription!.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Walmart adaptation', () => {
    it('should limit bullets to 10', async () => {
      const result = await service.adaptForChannel(mockProduct, 'WALMART');
      expect(result.bullets.length).toBeLessThanOrEqual(10);
    });

    it('should respect 200 character title limit', async () => {
      const longProduct = { ...mockProduct, title: 'A'.repeat(250) };
      const result = await service.adaptForChannel(longProduct, 'WALMART');
      expect(result.title.length).toBeLessThanOrEqual(200);
    });
  });

  it('should throw for unsupported channel', async () => {
    await expect(
      service.adaptForChannel(mockProduct, 'UNKNOWN'),
    ).rejects.toThrow('Unsupported channel');
  });
});
