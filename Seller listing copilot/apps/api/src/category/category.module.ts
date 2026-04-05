import { Module } from '@nestjs/common';
import { CategoryMappingService } from './category-mapping.service';
import { ItemSpecificsService } from './item-specifics.service';
import { CategoryController } from './category.controller';

@Module({
  controllers: [CategoryController],
  providers: [CategoryMappingService, ItemSpecificsService],
  exports: [CategoryMappingService, ItemSpecificsService],
})
export class CategoryModule {}
