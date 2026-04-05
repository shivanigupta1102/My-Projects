import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import storageConfig from '@/config/storage.config';
import { StorageModule } from '@/storage/storage.module';
import { CsvProcessor } from './processors/csv.processor';
import { ImageProcessor } from './processors/image.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { UrlProcessor } from './processors/url.processor';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
    StorageModule,
    BullModule.registerQueue({ name: 'ingest-asset' }),
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    ImageProcessor,
    CsvProcessor,
    PdfProcessor,
    UrlProcessor,
  ],
  exports: [
    IngestionService,
    ImageProcessor,
    CsvProcessor,
    PdfProcessor,
    UrlProcessor,
  ],
})
export class IngestionModule {}
