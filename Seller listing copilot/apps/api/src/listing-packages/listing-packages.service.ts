import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Channel, PackageStatus, Prisma, Severity } from '@prisma/client';
import { QualityScore } from '@listingpilot/shared-types';
import { PrismaService } from '@/config/database.config';
import { AmazonGenerator } from './generators/amazon.generator';
import { CanonicalFacts } from './generators/channel-generator.interface';
import { EbayGenerator } from './generators/ebay.generator';
import { EtsyGenerator } from './generators/etsy.generator';
import { ShopifyGenerator } from './generators/shopify.generator';
import { WalmartGenerator } from './generators/walmart.generator';
import { runValidation } from './validator/validation.engine';

@Injectable()
export class ListingPackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amazon: AmazonGenerator,
    private readonly ebay: EbayGenerator,
    private readonly walmart: WalmartGenerator,
    private readonly shopify: ShopifyGenerator,
    private readonly etsy: EtsyGenerator,
  ) {}

  private generatorFor(channel: Channel) {
    switch (channel) {
      case Channel.AMAZON:
        return this.amazon;
      case Channel.EBAY:
        return this.ebay;
      case Channel.WALMART:
        return this.walmart;
      case Channel.SHOPIFY:
        return this.shopify;
      case Channel.ETSY:
        return this.etsy;
      default:
        throw new BadRequestException('Unsupported channel');
    }
  }

  async buildFacts(organizationId: string, productId: string): Promise<CanonicalFacts> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
      include: { attributes: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const attrs: Record<string, unknown> = {};
    for (const a of product.attributes) {
      if (a.fieldName.startsWith('ingestion.')) continue;
      attrs[a.fieldName] = a.normalizedValue ?? a.value;
    }

    const str = (key: string): string | null => {
      const v = attrs[key];
      return typeof v === 'string' && v.trim() ? v.trim() : null;
    };
    const arr = (key: string): string[] => {
      const v = attrs[key];
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const description = str('human_description') ?? str('description');
    const bullets: string[] = [];
    const features = arr('notable_features');
    if (features.length) bullets.push(...features.map(f => f));
    const certs = arr('certifications');
    if (certs.length) bullets.push(`Certifications: ${certs.join(', ')}`);
    if (str('material')) bullets.push(`Material: ${str('material')}`);
    if (str('color')) bullets.push(`Color: ${str('color')}`);
    if (str('condition')) bullets.push(`Condition: ${str('condition')}`);
    if (str('text_on_product')) bullets.push(`Product text: ${str('text_on_product')}`);

    const keywords: string[] = [];
    if (product.title) keywords.push(...product.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (product.brand) keywords.push(product.brand.toLowerCase());
    if (str('category')) keywords.push(str('category')!.toLowerCase());

    const channelAttrs = { ...attrs };
    for (const skip of ['description', 'human_description', 'notable_features', 'certifications', 'text_on_product']) {
      delete channelAttrs[skip];
    }

    return {
      title: product.title,
      brand: product.brand,
      bullets,
      description,
      attributes: channelAttrs,
      keywords: [...new Set(keywords)],
      images: [],
    };
  }

  async generatePackages(
    organizationId: string,
    productId: string,
    channels: Channel[],
  ): Promise<{ channel: Channel; status: 'fulfilled' | 'rejected'; error?: string }[]> {
    const facts = await this.buildFacts(organizationId, productId);
    const tasks = channels.map(async (ch) => {
      const gen = this.generatorFor(ch);
      const pkg = await gen.generate(facts);
      const score = runValidation(ch, {
        ...facts,
        title: pkg.title,
        bullets: pkg.bullets,
        description: pkg.description,
        attributes: pkg.attributes,
        keywords: pkg.keywords,
        images: pkg.images,
      });
      const listing = await this.prisma.listingPackage.upsert({
        where: {
          productId_channel: { productId, channel: ch },
        },
        create: {
          productId,
          channel: ch,
          status: PackageStatus.DRAFT,
          title: pkg.title,
          bulletsJson: pkg.bullets,
          description: pkg.description,
          attributesJson: pkg.attributes as Prisma.InputJsonValue,
          keywordsJson: pkg.keywords,
          imagesJson: pkg.images as Prisma.InputJsonValue,
          qualityScore: score.total,
          payloadJson: score as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: pkg.title,
          bulletsJson: pkg.bullets,
          description: pkg.description,
          attributesJson: pkg.attributes as Prisma.InputJsonValue,
          keywordsJson: pkg.keywords,
          imagesJson: pkg.images as Prisma.InputJsonValue,
          qualityScore: score.total,
          payloadJson: score as unknown as Prisma.InputJsonValue,
        },
      });

      await this.prisma.validation.deleteMany({ where: { listingPackageId: listing.id } });
      for (const issue of score.issues) {
        await this.prisma.validation.create({
          data: {
            listingPackageId: listing.id,
            field: issue.field,
            rule: issue.rule,
            severity: issue.severity,
            message: issue.message,
            suggestedFix: issue.suggestedFix,
          },
        });
      }

      return { channel: ch, listingId: listing.id };
    });

    const settled = await Promise.allSettled(tasks);
    return settled.map((s, i) => {
      if (s.status === 'fulfilled') {
        return { channel: channels[i] as Channel, status: 'fulfilled' as const };
      }
      return {
        channel: channels[i] as Channel,
        status: 'rejected' as const,
        error: s.reason instanceof Error ? s.reason.message : 'Unknown error',
      };
    });
  }

  async getById(organizationId: string, id: string) {
    const lp = await this.prisma.listingPackage.findFirst({
      where: { id, product: { organizationId } },
      include: { validations: true, product: true },
    });
    if (!lp) throw new NotFoundException('Listing package not found');
    return lp;
  }

  async validate(organizationId: string, id: string): Promise<QualityScore> {
    const lp = await this.getById(organizationId, id);
    const facts: CanonicalFacts = {
      title: lp.title,
      brand: typeof lp.attributesJson === 'object' && lp.attributesJson !== null
        ? String((lp.attributesJson as Record<string, unknown>).brand ?? '')
        : null,
      bullets: lp.bulletsJson as string[],
      description: lp.description,
      attributes: lp.attributesJson as Record<string, unknown>,
      keywords: lp.keywordsJson as string[],
      images: lp.imagesJson as { url: string; role: string; order: number }[],
    };
    return runValidation(lp.channel, facts);
  }

  async updatePackage(
    organizationId: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      status: PackageStatus;
    }>,
  ) {
    await this.getById(organizationId, id);
    return this.prisma.listingPackage.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async byProduct(organizationId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.listingPackage.findMany({
      where: { productId },
      include: { validations: true },
    });
  }

  async hasBlockingValidations(listingPackageId: string): Promise<boolean> {
    const count = await this.prisma.validation.count({
      where: { listingPackageId, severity: Severity.BLOCKING },
    });
    return count > 0;
  }
}
