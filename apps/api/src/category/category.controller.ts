import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryMappingService } from './category-mapping.service';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('api/v1/products/:productId')
export class CategoryController {
  constructor(private readonly categoryMapping: CategoryMappingService) {}

  @Post('map-categories')
  async mapCategories(@Param('productId') productId: string) {
    return { productId, status: 'mapping' };
  }

  @Get('category-mappings')
  async getCategoryMappings(@Param('productId') productId: string) {
    return { productId, mappings: [] };
  }

  @Put('category-mappings/:channel')
  async overrideCategoryMapping(
    @Param('productId') productId: string,
    @Param('channel') channel: string,
    @Body() body: { categoryId: string },
  ) {
    await this.categoryMapping.confirmMapping(productId, channel, body.categoryId);
    return { productId, channel, confirmed: true };
  }
}
