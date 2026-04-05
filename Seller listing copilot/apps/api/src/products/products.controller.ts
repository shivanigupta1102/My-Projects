import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard, Public } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    @InjectQueue('ingest-asset') private readonly ingestQueue: Queue,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  async list(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.products.list(
      user.organizationId,
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 20,
    );
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto) {
    const data = await this.products.create(user.organizationId, dto);
    return { success: true, data };
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Get image URLs for product source assets' })
  async images(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.products.getImages(user.organizationId, id);
    return { success: true, data };
  }

  @Get(':id/images/:assetId/file')
  @ApiOperation({ summary: 'Stream product image bytes (proxy for external access)' })
  async imageFile(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.products.getImageFile(user.organizationId, id, assetId);
    res.set('Content-Type', mimeType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(buffer);
  }

  @Public()
  @Get(':id/images/:assetId/raw')
  @ApiOperation({ summary: 'Public image endpoint — no auth required, asset IDs are unguessable' })
  async imageRaw(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.products.getImageFilePublic(id, assetId);
    res.set('Content-Type', mimeType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(buffer);
  }

  @Get(':id/attributes')
  @ApiOperation({ summary: 'List product attributes' })
  async attributes(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.products.listAttributes(user.organizationId, id);
    return { success: true, data };
  }

  @Post(':id/attributes')
  @ApiOperation({ summary: 'Add attribute' })
  async addAttribute(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateAttributeDto,
  ) {
    const data = await this.products.addAttribute(user.organizationId, id, dto);
    return { success: true, data };
  }

  @Patch(':id/attributes/:attrId')
  @ApiOperation({ summary: 'Update attribute value' })
  async patchAttribute(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attrId') attrId: string,
    @Body() body: { value?: string; normalizedValue?: string },
  ) {
    const data = await this.products.updateAttribute(user.organizationId, id, attrId, body);
    return { success: true, data };
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'List evidence for product' })
  async evidence(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.products.listEvidence(user.organizationId, id);
    return { success: true, data };
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Link evidence to product' })
  async linkEvidence(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body()
    body: {
      attributeId?: string;
      sourceAssetId?: string;
      snippet?: string;
      explanation: string;
      confidence: number;
    },
  ) {
    const data = await this.products.linkEvidence(user.organizationId, id, body);
    return { success: true, data };
  }

  @Post(':id/retry-extraction')
  @ApiOperation({ summary: 'Re-run AI extraction for all assets of this product' })
  async retryExtraction(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const product = await this.products.getById(user.organizationId, id);
    if (!product.ingestionJobId) {
      return { success: true, data: { queued: 0, message: 'No ingestion job linked to this product' } };
    }
    await this.products.clearExtractionErrors(id);
    const assets = await this.products.getSourceAssets(product.ingestionJobId);
    let queued = 0;
    for (const asset of assets) {
      await this.ingestQueue.add('process', {
        organizationId: user.organizationId,
        ingestionJobId: product.ingestionJobId,
        sourceAssetId: asset.id,
      }, { attempts: 3, timeout: 5 * 60 * 1000, removeOnComplete: true });
      queued++;
    }
    return { success: true, data: { queued, message: `Re-queued ${queued} asset(s) for AI extraction` } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.products.getById(user.organizationId, id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  async patch(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.products.update(user.organizationId, id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.products.remove(user.organizationId, id);
    return { success: true, data: { deleted: true } };
  }
}
