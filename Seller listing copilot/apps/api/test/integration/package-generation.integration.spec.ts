import { Test } from '@nestjs/testing';
import {
  Channel,
  PackageStatus,
  ProductStatus,
  ReviewStatus,
  Severity,
} from '@prisma/client';
import {
  AMAZON_TITLE_LIMIT,
  EBAY_TITLE_LIMIT,
  ETSY_TITLE_LIMIT,
  SHOPIFY_TITLE_LIMIT,
} from '@listingpilot/channel-schemas';
import { PrismaService } from '@/config/database.config';
import { AmazonGenerator } from '@/listing-packages/generators/amazon.generator';
import { EbayGenerator } from '@/listing-packages/generators/ebay.generator';
import { EtsyGenerator } from '@/listing-packages/generators/etsy.generator';
import { ShopifyGenerator } from '@/listing-packages/generators/shopify.generator';
import { WalmartGenerator } from '@/listing-packages/generators/walmart.generator';
import { ListingPackagesService } from '@/listing-packages/listing-packages.service';

const ORG = 'org-pkg';

function attrRows(
  pairs: Array<[string, string]>,
): Array<{ fieldName: string; normalizedValue: string | null; value: string | null }> {
  return pairs.map(([fieldName, v]) => ({
    fieldName,
    normalizedValue: v,
    value: null,
  }));
}

describe('ListingPackagesService.generatePackages (integration)', () => {
  it('approved product generates packages for requested channels with titles within limits', async () => {
    const upsertTitles: Partial<Record<Channel, string>> = {};

    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'prod-1',
          organizationId: ORG,
          title: 'x'.repeat(300),
          brand: 'Brand',
          status: ProductStatus.APPROVED,
          reviewStatus: ReviewStatus.APPROVED,
          attributes: attrRows([
            ['a', '1'],
            ['b', '2'],
            ['c', '3'],
            ['d', '4'],
            ['brand', 'Brand'],
          ]),
        }),
      },
      listingPackage: {
        upsert: jest.fn(
          async ({
            create,
            where,
          }: {
            create: { title: string; channel: Channel; productId: string };
            where: { productId_channel: { productId: string; channel: Channel } };
          }) => {
            upsertTitles[create.channel] = create.title;
            return {
              id: `lp-${create.channel}`,
              productId: where.productId_channel.productId,
              channel: create.channel,
              title: create.title,
              status: PackageStatus.DRAFT,
            };
          },
        ),
      },
      validation: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'v1' }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListingPackagesService,
        AmazonGenerator,
        EbayGenerator,
        WalmartGenerator,
        ShopifyGenerator,
        EtsyGenerator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const svc = moduleRef.get(ListingPackagesService);
    const channels = [Channel.AMAZON, Channel.EBAY, Channel.SHOPIFY, Channel.ETSY, Channel.WALMART];
    const results = await svc.generatePackages(ORG, 'prod-1', channels);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(Object.keys(upsertTitles).sort()).toEqual([...channels].sort());
    expect((upsertTitles[Channel.AMAZON] ?? '').length).toBeLessThanOrEqual(AMAZON_TITLE_LIMIT);
    expect((upsertTitles[Channel.EBAY] ?? '').length).toBeLessThanOrEqual(EBAY_TITLE_LIMIT);
    expect((upsertTitles[Channel.SHOPIFY] ?? '').length).toBeLessThanOrEqual(SHOPIFY_TITLE_LIMIT);
    expect((upsertTitles[Channel.ETSY] ?? '').length).toBeLessThanOrEqual(ETSY_TITLE_LIMIT);
    expect((upsertTitles[Channel.WALMART] ?? '').length).toBeLessThanOrEqual(200);
  });

  it('records validation issues for incomplete products (missing Amazon brand)', async () => {
    const createdIssues: Array<{ severity: Severity; rule: string }> = [];

    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'prod-bad',
          organizationId: ORG,
          title: 'Twenty character title xx',
          brand: null,
          status: ProductStatus.APPROVED,
          reviewStatus: ReviewStatus.APPROVED,
          attributes: attrRows([
            ['a', '1'],
            ['b', '2'],
            ['c', '3'],
            ['d', '4'],
            ['e', '5'],
          ]),
        }),
      },
      listingPackage: {
        upsert: jest.fn().mockResolvedValue({ id: 'lp-1' }),
      },
      validation: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(async ({ data }) => {
          createdIssues.push({ severity: data.severity, rule: data.rule });
          return { id: 'v' };
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListingPackagesService,
        AmazonGenerator,
        EbayGenerator,
        WalmartGenerator,
        ShopifyGenerator,
        EtsyGenerator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const svc = moduleRef.get(ListingPackagesService);
    await svc.generatePackages(ORG, 'prod-bad', [Channel.AMAZON]);

    expect(createdIssues.some((i) => i.rule === 'required-fields' && i.severity === Severity.BLOCKING)).toBe(
      true,
    );
  });

  it('Promise.allSettled: one failing channel does not block others', async () => {
    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'prod-2',
          organizationId: ORG,
          title: 'Twenty character title xx',
          brand: 'B',
          status: ProductStatus.APPROVED,
          reviewStatus: ReviewStatus.APPROVED,
          attributes: attrRows([
            ['a', '1'],
            ['b', '2'],
            ['c', '3'],
            ['d', '4'],
            ['brand', 'B'],
          ]),
        }),
      },
      listingPackage: {
        upsert: jest.fn().mockResolvedValue({ id: 'lp-x' }),
      },
      validation: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'v' }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListingPackagesService,
        AmazonGenerator,
        EbayGenerator,
        WalmartGenerator,
        ShopifyGenerator,
        EtsyGenerator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const svc = moduleRef.get(ListingPackagesService);
    const walmart = moduleRef.get(WalmartGenerator);

    jest.spyOn(walmart, 'generate').mockRejectedValueOnce(new Error('Walmart channel down'));

    const results = await svc.generatePackages(ORG, 'prod-2', [Channel.AMAZON, Channel.WALMART]);

    const amazon = results.find((r) => r.channel === Channel.AMAZON);
    const wm = results.find((r) => r.channel === Channel.WALMART);
    expect(amazon?.status).toBe('fulfilled');
    expect(wm?.status).toBe('rejected');
    expect(wm?.error).toContain('Walmart');
  });

  it('unsupported channel rejects without affecting Promise.allSettled shape', async () => {
    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'p',
          organizationId: ORG,
          title: 'Twenty character title xx',
          brand: 'B',
          status: ProductStatus.APPROVED,
          reviewStatus: ReviewStatus.APPROVED,
          attributes: attrRows([
            ['a', '1'],
            ['b', '2'],
            ['c', '3'],
            ['d', '4'],
            ['brand', 'B'],
          ]),
        }),
      },
      listingPackage: {
        upsert: jest.fn().mockResolvedValue({ id: 'lp-mock' }),
      },
      validation: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'v' }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListingPackagesService,
        AmazonGenerator,
        EbayGenerator,
        WalmartGenerator,
        ShopifyGenerator,
        EtsyGenerator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const svc = moduleRef.get(ListingPackagesService);
    const badChannel = 'FAKE' as Channel;

    const results = await svc.generatePackages(ORG, 'p', [Channel.AMAZON, badChannel]);

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe('fulfilled');
    expect(results[1]?.status).toBe('rejected');
    expect(String(results[1]?.error)).toContain('Unsupported channel');
  });
});
