import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiConfig from '@/config/ai.config';
import { DatabaseModule } from '@/config/database.module';
import { IngestionModule } from '@/ingestion/ingestion.module';
import { StorageModule } from '@/storage/storage.module';
import { LlmService } from './llm.service';
import { ExtractionPipeline } from './extraction.pipeline';
import { OcrService } from './ocr.service';
import { VisionService } from './vision.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forFeature(aiConfig),
    StorageModule,
    IngestionModule,
  ],
  providers: [LlmService, OcrService, VisionService, ExtractionPipeline],
  exports: [LlmService, OcrService, VisionService, ExtractionPipeline],
})
export class AiModule {}
