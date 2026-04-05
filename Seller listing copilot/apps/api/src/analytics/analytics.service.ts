import { Injectable } from '@nestjs/common';
import { DashboardSummary } from '@listingpilot/shared-types';
import {
  MonitorStatus,
  ProductStatus,
  ReviewStatus,
} from '@prisma/client';
import { PrismaService } from '@/config/database.config';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(organizationId: string): Promise<DashboardSummary> {
    const [
      totalProducts,
      needsReview,
      publishedProducts,
      monitors,
      completeness,
    ] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { organizationId } }),
      this.prisma.product.count({
        where: { organizationId, reviewStatus: ReviewStatus.NEEDS_REVIEW },
      }),
      this.prisma.product.count({
        where: { organizationId, status: ProductStatus.PUBLISHED },
      }),
      this.prisma.monitor.count({
        where: { organizationId, status: MonitorStatus.ACTIVE },
      }),
      this.prisma.product.aggregate({
        where: { organizationId },
        _avg: { completeness: true },
      }),
    ]);

    const recent = await this.prisma.publishEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { product: { select: { title: true } } },
    });

    return {
      totalProducts,
      productsNeedingReview: needsReview,
      readyToPublish: await this.prisma.product.count({
        where: {
          organizationId,
          status: ProductStatus.APPROVED,
          reviewStatus: ReviewStatus.APPROVED,
        },
      }),
      publishedListings: publishedProducts,
      activeAlerts: monitors,
      avgCompleteness: completeness._avg.completeness ?? 0,
      timeSavedHours: Math.round(totalProducts * 0.25 * 10) / 10,
      recentPublishEvents: recent.map((e) => ({
        id: e.id,
        productTitle: e.product.title ?? '(untitled)',
        channel: e.channel,
        status: e.status,
        publishedAt: e.publishedAt?.toISOString() ?? null,
      })),
    };
  }

  async completenessByChannel(organizationId: string) {
    const packages = await this.prisma.listingPackage.findMany({
      where: { product: { organizationId } },
      select: { channel: true, qualityScore: true },
    });
    const byChannel: Record<string, { count: number; avgQuality: number }> = {};
    for (const p of packages) {
      const c = p.channel;
      if (!byChannel[c]) {
        byChannel[c] = { count: 0, avgQuality: 0 };
      }
      byChannel[c].count += 1;
      byChannel[c].avgQuality += p.qualityScore ?? 0;
    }
    for (const k of Object.keys(byChannel)) {
      const b = byChannel[k];
      if (b) {
        b.avgQuality = b.count ? b.avgQuality / b.count : 0;
      }
    }
    return byChannel;
  }
}
