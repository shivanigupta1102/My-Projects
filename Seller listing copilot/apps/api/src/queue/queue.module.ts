import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisConfig from '@/config/redis.config';
import { DatabaseModule } from '@/config/database.module';
import { AiModule } from '@/ai/ai.module';
import { IngestionModule } from '@/ingestion/ingestion.module';
import { ListingPackagesModule } from '@/listing-packages/listing-packages.module';
import { MonitoringModule } from '@/monitoring/monitoring.module';
import { ProductsModule } from '@/products/products.module';
import { PublishModule } from '@/publish/publish.module';
import { StorageModule } from '@/storage/storage.module';
import { BuildCanonicalProcessor } from './jobs/build-canonical.job';
import { GeneratePackagesProcessor } from './jobs/generate-packages.job';
import { IngestAssetProcessor } from './jobs/ingest-asset.job';
import { MonitorListingProcessor } from './jobs/monitor-listing.job';
import { PublishListingProcessor } from './jobs/publish-listing.job';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forFeature(redisConfig),
    StorageModule,
    AiModule,
    forwardRef(() => IngestionModule),
    ProductsModule,
    ListingPackagesModule,
    forwardRef(() => PublishModule),
    MonitoringModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const r = config.get<{
          host: string;
          port: number;
          password?: string;
          tls: boolean;
          bullPrefix: string;
        }>('redis');
        if (!r) {
          throw new Error('Redis config missing');
        }
        return {
          redis: {
            host: r.host,
            port: r.port,
            ...(r.password ? { password: r.password } : {}),
            ...(r.tls ? { tls: {} } : {}),
          },
          prefix: r.bullPrefix,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'ingest-asset' },
      { name: 'build-canonical' },
      { name: 'generate-packages' },
      { name: 'publish-listing' },
      { name: 'monitor-listing' },
    ),
  ],
  providers: [
    IngestAssetProcessor,
    BuildCanonicalProcessor,
    GeneratePackagesProcessor,
    PublishListingProcessor,
    MonitorListingProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule {}
