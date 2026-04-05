import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Channel } from '@prisma/client';
import { ListingPackagesService } from '@/listing-packages/listing-packages.service';

export interface GeneratePackagesJobPayload {
  organizationId: string;
  productId: string;
  channels: Channel[];
}

@Processor('generate-packages')
export class GeneratePackagesProcessor {
  private readonly logger = new Logger(GeneratePackagesProcessor.name);

  constructor(private readonly packages: ListingPackagesService) {}

  @Process('process')
  async handle(job: Job<GeneratePackagesJobPayload>): Promise<void> {
    const { organizationId, productId, channels } = job.data;
    await this.packages.generatePackages(organizationId, productId, channels);
    this.logger.log(`Packages generated for ${productId}`);
  }
}
