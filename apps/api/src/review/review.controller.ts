import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { ReviewService } from './review.service';

@ApiTags('review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('review-queue')
export class ReviewController {
  constructor(private readonly review: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get review queue (lowest confidence first)' })
  async queue(@CurrentUser() user: RequestUser) {
    const data = await this.review.getQueue(user.organizationId);
    return { success: true, data };
  }

  @Post('approve')
  @ApiOperation({ summary: 'Approve single attribute' })
  async approve(
    @CurrentUser() user: RequestUser,
    @Body() body: { attributeId: string },
  ) {
    const data = await this.review.approve(user.organizationId, body.attributeId);
    return { success: true, data };
  }

  @Post('override')
  @ApiOperation({ summary: 'Override attribute value (seller confirmed)' })
  async override(
    @CurrentUser() user: RequestUser,
    @Body()
    body: { attributeId: string; value: string; normalizedValue?: string },
  ) {
    const data = await this.review.override(
      user.organizationId,
      body.attributeId,
      body.value,
      body.normalizedValue,
    );
    return { success: true, data };
  }

  @Post('bulk-approve')
  @ApiOperation({ summary: 'Bulk approve attributes (min confidence 0.60)' })
  async bulkApprove(
    @CurrentUser() user: RequestUser,
    @Body() body: { attributeIds: string[] },
  ) {
    const data = await this.review.bulkApprove(user.organizationId, body.attributeIds);
    return { success: true, data };
  }
}
