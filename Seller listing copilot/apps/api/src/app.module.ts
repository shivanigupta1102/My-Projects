import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AdaptationModule } from './adaptation/adaptation.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BulkOpsModule } from './bulk-ops/bulk-ops.module';
import { CategoryModule } from './category/category.module';
import { ComplianceModule } from './compliance/compliance.module';
import aiConfig from './config/ai.config';
import { DatabaseModule } from './config/database.module';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import { EvidenceModule } from './evidence/evidence.module';
import { HealthModule } from './health/health.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { ListingPackagesModule } from './listing-packages/listing-packages.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProductsModule } from './products/products.module';
import { PublishModule } from './publish/publish.module';
import { QueueModule } from './queue/queue.module';
import { ReviewModule } from './review/review.module';
import { SemanticDedupModule } from './semantic-dedup/semantic-dedup.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { VisionModule } from './vision/vision.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '.env'),
        '.env',
      ],
      load: [redisConfig, storageConfig, aiConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    QueueModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    IngestionModule,
    ProductsModule,
    EvidenceModule,
    HealthModule,
    ReviewModule,
    AiModule,
    ListingPackagesModule,
    PublishModule,
    StorageModule,
    AuditModule,
    AnalyticsModule,
    MonitoringModule,
    VisionModule,
    ComplianceModule,
    CategoryModule,
    AdaptationModule,
    BulkOpsModule,
    SemanticDedupModule,
  ],
})
export class AppModule {}
