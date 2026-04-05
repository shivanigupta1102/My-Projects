import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { PublishDto } from './dto/publish.dto';
import { PublishService } from './publish.service';

@ApiTags('publish')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('publish')
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post()
  @ApiOperation({ summary: 'Publish listing to channel (audit logged before API call)' })
  async publish(@CurrentUser() user: RequestUser, @Body() dto: PublishDto) {
    const data = await this.publishService.publish(
      user.organizationId,
      user.userId,
      dto,
    );
    return { success: true, data };
  }

  @Get('events')
  @ApiOperation({ summary: 'List publish events' })
  async events(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.publishService.listEvents(
      user.organizationId,
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 20,
    );
    return { success: true, data };
  }

  @Post('revert/:id')
  @ApiOperation({ summary: 'Mark publish event as rolled back' })
  async revert(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.publishService.revert(user.organizationId, id);
    return { success: true, data };
  }
}
