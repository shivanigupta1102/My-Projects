import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MonitorService } from '../monitor.service';

@Injectable()
export class MonitorScheduler {
  private readonly logger = new Logger(MonitorScheduler.name);

  constructor(private readonly monitors: MonitorService) {}

  /** Every 6 hours */
  @Cron('0 */6 * * *')
  async runMonitoring(): Promise<void> {
    this.logger.log('Running scheduled monitor poll');
    await this.monitors.pollListingHealth();
  }
}
