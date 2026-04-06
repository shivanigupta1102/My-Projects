import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AiModule } from '@/ai/ai.module';
import { StorageModule } from '@/storage/storage.module';
import { CanonicalBuilder } from './canonical.builder';
import { NormalizerService } from './normalizer.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [StorageModule, AiModule, BullModule.registerQueue({ name: 'ingest-asset' })],
  controllers: [ProductsController],
  providers: [ProductsService, NormalizerService, CanonicalBuilder],
  exports: [ProductsService, CanonicalBuilder, NormalizerService],
})
export class ProductsModule {}
