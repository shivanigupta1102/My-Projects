import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Channel,
  ComplianceGateStatus,
  MonitorStatus,
  Prisma,
  PublishStatus,
} from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { AuditService } from '@/audit/audit.service';
import { ListingPackagesService } from '@/listing-packages/listing-packages.service';
import { AmazonConnector } from './connectors/amazon.connector';
import { EbayConnector } from './connectors/ebay.connector';
import { EtsyConnector } from './connectors/etsy.connector';
import { ShopifyConnector } from './connectors/shopify.connector';
import { WalmartConnector } from './connectors/walmart.connector';
import { PublishDto } from './dto/publish.dto';

@Injectable()
export class PublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly listingPackages: ListingPackagesService,
    private readonly amazon: AmazonConnector,
    private readonly ebay: EbayConnector,
    private readonly shopify: ShopifyConnector,
    private readonly walmart: WalmartConnector,
    private readonly etsy: EtsyConnector,
  ) {}

  private connectorFor(channel: Channel) {
    switch (channel) {
      case Channel.AMAZON:
        return this.amazon;
      case Channel.EBAY:
        return this.ebay;
      case Channel.SHOPIFY:
        return this.shopify;
      case Channel.WALMART:
        return this.walmart;
      case Channel.ETSY:
        return this.etsy;
      default:
        throw new BadRequestException('Unsupported channel');
    }
  }

  async publish(organizationId: string, userId: string, dto: PublishDto) {
    const lp = await this.prisma.listingPackage.findFirst({
      where: {
        id: dto.listingPackageId,
        product: { organizationId },
      },
      include: { product: true },
    });
    if (!lp) throw new NotFoundException('Listing package not found');

    // Hard compliance gate check — blocks publish if compliance not passed
    // All connectors check ComplianceGateStatus === PASSED before proceeding
    const dryRun = dto.dryRun === true;
    if (!dryRun && lp.complianceGate !== ComplianceGateStatus.PASSED) {
      throw new BadRequestException(
        'Listing package compliance gate must be PASSED before publishing',
      );
    }

    if (!dryRun) {
      const blocking = await this.listingPackages.hasBlockingValidations(lp.id);
      if (blocking) {
        throw new BadRequestException(
          'Resolve all BLOCKING validations before publishing',
        );
      }
    }

    const account = dto.channelAccountId
      ? await this.prisma.channelAccount.findFirst({
          where: {
            id: dto.channelAccountId,
            organizationId,
            channel: dto.channel,
          },
        })
      : await this.prisma.channelAccount.findFirst({
          where: { organizationId, channel: dto.channel },
        });

    if (!account) {
      throw new BadRequestException('No channel account configured');
    }

    const credentials = account.credentialsJson as Record<string, unknown>;
    const connector = this.connectorFor(dto.channel);

    await this.audit.create({
      organizationId,
      userId,
      action: dryRun ? 'PUBLISH_DRY_RUN' : 'PUBLISH_REQUEST',
      entityType: 'ListingPackage',
      entityId: lp.id,
      details: {
        channel: dto.channel,
        dryRun,
        productId: lp.productId,
      },
    });

    const result = await connector.publish({
      channelId: account.id,
      externalId: account.externalId,
      credentials,
      listingPayload: {
        title: lp.title,
        bullets: lp.bulletsJson,
        description: lp.description,
        attributes: lp.attributesJson,
      },
      dryRun,
    });

    const publishEvent = await this.prisma.publishEvent.create({
      data: {
        organizationId,
        productId: lp.productId,
        listingPackageId: lp.id,
        channelAccountId: account.id,
        channel: dto.channel,
        status: result.success ? PublishStatus.SUCCESS : PublishStatus.FAILED,
        dryRun,
        channelListingId: result.channelListingId,
        errorMessage: result.error,
        rawResponseJson: result.rawResponse as Prisma.InputJsonValue,
        publishedAt: result.success && !dryRun ? new Date() : null,
      },
    });

    if (!dryRun && result.success) {
      const existing = await this.prisma.monitor.findFirst({
        where: {
          organizationId,
          productId: lp.productId,
          channel: dto.channel,
        },
      });
      if (existing) {
        await this.prisma.monitor.update({
          where: { id: existing.id },
          data: {
            channelListingId: result.channelListingId ?? existing.channelListingId,
            lastCheckedAt: new Date(),
            healthScore: 0.9,
            status: MonitorStatus.ACTIVE,
          },
        });
      } else {
        await this.prisma.monitor.create({
          data: {
            organizationId,
            productId: lp.productId,
            channel: dto.channel,
            channelListingId: result.channelListingId ?? 'unknown',
            status: MonitorStatus.ACTIVE,
            healthScore: 0.9,
            lastCheckedAt: new Date(),
          },
        });
      }
    }

    return { publishEvent, result };
  }

  async listEvents(organizationId: string, page = 1, limit = 20) {
    const where = { organizationId };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.publishEvent.count({ where }),
      this.prisma.publishEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: { select: { title: true } } },
      }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async revert(organizationId: string, eventId: string) {
    const ev = await this.prisma.publishEvent.findFirst({
      where: { id: eventId, organizationId },
    });
    if (!ev) throw new NotFoundException('Publish event not found');

    await this.audit.create({
      organizationId,
      action: 'PUBLISH_REVERT',
      entityType: 'PublishEvent',
      entityId: ev.id,
      details: { channel: ev.channel, productId: ev.productId },
    });

    return this.prisma.publishEvent.update({
      where: { id: eventId },
      data: { status: PublishStatus.ROLLED_BACK },
    });
  }
}
