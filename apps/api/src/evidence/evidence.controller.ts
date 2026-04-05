import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { EvidenceService } from './evidence.service';

@ApiTags('evidence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'List evidence for a product' })
  async byProduct(
    @CurrentUser() user: RequestUser,
    @Param('productId') productId: string,
  ) {
    const data = await this.evidence.list(user.organizationId, productId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence by id' })
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.evidence.getById(user.organizationId, id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create evidence' })
  async create(
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      productId: string;
      attributeId?: string;
      sourceAssetId?: string;
      snippet?: string;
      explanation: string;
      confidence: number;
      regionJson?: Record<string, unknown>;
    },
  ) {
    const data = await this.evidence.create(user.organizationId, body);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update evidence' })
  async patch(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body()
    body: { snippet?: string; explanation?: string; confidence?: number },
  ) {
    const data = await this.evidence.update(user.organizationId, id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete evidence' })
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.evidence.remove(user.organizationId, id);
    return { success: true, data: { deleted: true } };
  }
}
