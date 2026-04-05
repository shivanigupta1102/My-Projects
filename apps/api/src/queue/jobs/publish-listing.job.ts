import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Channel } from '@prisma/client';
import { PublishService } from '@/publish/publish.service';

export interface PublishListingJobPayload {
  organizationId: string;
  userId: string;
  listingPackageId: string;
  channel: Channel;
  channelAccountId?: string;
  dryRun: boolean;
}

@Processor('publish-listing')
export class PublishListingProcessor {
  private readonly logger = new Logger(PublishListingProcessor.name);

  constructor(private readonly publish: PublishService) {}

  @Process('process')
  async handle(job: Job<PublishListingJobPayload>): Promise<void> {
    const jitter = Math.floor(Math.random() * 500);
    await new Promise((r) => setTimeout(r, jitter));
    await this.publish.publish(job.data.organizationId, job.data.userId, {
      listingPackageId: job.data.listingPackageId,
      channel: job.data.channel,
      channelAccountId: job.data.channelAccountId,
      dryRun: job.data.dryRun,
    });
    this.logger.log(`Publish job ${job.id} completed`);
  }
}
