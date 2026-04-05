import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

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
