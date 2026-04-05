import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { CreateIngestionDto } from './dto/create-ingestion.dto';
import { IngestionService, UploadedFileMeta } from './ingestion.service';

@ApiTags('ingestions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ingestions')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Post()
  @ApiOperation({ summary: 'Create ingestion job with multipart files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceLabel: { type: 'string' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async create(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateIngestionDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const metas: UploadedFileMeta[] = (files ?? []).map((f) => ({
      buffer: f.buffer,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    }));
    const data = await this.ingestion.createJob(
      user.organizationId,
      metas,
      body.sourceLabel,
    );
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingestion job' })
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.ingestion.getById(user.organizationId, id);
    return { success: true, data };
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'List assets for ingestion job' })
  async assets(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.ingestion.listAssets(user.organizationId, id);
    return { success: true, data };
  }
}
