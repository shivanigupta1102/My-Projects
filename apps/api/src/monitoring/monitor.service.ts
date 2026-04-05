import { Injectable, NotFoundException } from '@nestjs/common';
import { MonitorStatus, RemediationStatus } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { rankRemediationImpact } from './remediation.engine';

@Injectable()
export class MonitorService {
  constructor(private readonly prisma: PrismaService) {}

  async listMonitors(organizationId: string) {
    return this.prisma.monitor.findMany({
      where: { organizationId },
      include: { product: { select: { title: true } } },
    });
  }

  async health(organizationId: string, id: string) {
    const m = await this.prisma.monitor.findFirst({
      where: { id, organizationId },
    });
    if (!m) throw new NotFoundException('Monitor not found');
    return {
      monitorId: m.id,
      healthScore: m.healthScore,
      status: m.status,
      lastCheckedAt: m.lastCheckedAt,
    };
  }

  async listRemediations(organizationId: string) {
    const rows = await this.prisma.remediationRecommendation.findMany({
      where: { monitor: { organizationId } },
      include: { monitor: true },
      orderBy: { impactScore: 'desc' },
    });
    return rows.map((r) => ({
      ...r,
      rankedImpact: rankRemediationImpact(r.type),
    }));
  }

  async applyRemediation(
    organizationId: string,
    id: string,
  ) {
    const r = await this.prisma.remediationRecommendation.findFirst({
      where: { id, monitor: { organizationId } },
    });
    if (!r) throw new NotFoundException('Remediation not found');
    return this.prisma.remediationRecommendation.update({
      where: { id },
      data: { status: RemediationStatus.APPLIED },
    });
  }

  async dismissRemediation(organizationId: string, id: string) {
    const r = await this.prisma.remediationRecommendation.findFirst({
      where: { id, monitor: { organizationId } },
    });
    if (!r) throw new NotFoundException('Remediation not found');
    return this.prisma.remediationRecommendation.update({
      where: { id },
      data: { status: RemediationStatus.DISMISSED },
    });
  }

  async pollListingHealth(): Promise<void> {
    const monitors = await this.prisma.monitor.findMany({
      where: { status: MonitorStatus.ACTIVE },
    });
    for (const m of monitors) {
      const jitter = 0.85 + Math.random() * 0.1;
      await this.prisma.monitor.update({
        where: { id: m.id },
        data: {
          healthScore: Math.min(1, (m.healthScore ?? 0.8) * jitter),
          lastCheckedAt: new Date(),
        },
      });
    }
  }
}
