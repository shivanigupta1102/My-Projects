import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/config/database.config';
import { MonitorService } from '@/monitoring/monitor.service';

export interface MonitorListingJobPayload {
  monitorId: string;
}

@Processor('monitor-listing')
export class MonitorListingProcessor {
  private readonly logger = new Logger(MonitorListingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monitors: MonitorService,
  ) {}

  @Process('process')
  async handle(job: Job<MonitorListingJobPayload>): Promise<void> {
    const { monitorId } = job.data;
    const m = await this.prisma.monitor.findUnique({ where: { id: monitorId } });
    if (!m) {
      this.logger.warn(`Monitor ${monitorId} not found — idempotent skip`);
      return;
    }
    await this.monitors.pollListingHealth();
    this.logger.log(`Monitor poll for ${monitorId}`);
  }
}
