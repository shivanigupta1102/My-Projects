import { Module } from '@nestjs/common';
import { MonitorScheduler } from './schedulers/monitor.scheduler';
import { MonitoringController } from './monitoring.controller';
import { MonitorService } from './monitor.service';

@Module({
  controllers: [MonitoringController],
  providers: [MonitorService, MonitorScheduler],
  exports: [MonitorService],
})
export class MonitoringModule {}
