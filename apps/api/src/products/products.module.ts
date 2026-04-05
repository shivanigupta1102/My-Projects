import { Module } from '@nestjs/common';
import { CanonicalBuilder } from './canonical.builder';
import { NormalizerService } from './normalizer.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, NormalizerService, CanonicalBuilder],
  exports: [ProductsService, CanonicalBuilder, NormalizerService],
})
export class ProductsModule {}
