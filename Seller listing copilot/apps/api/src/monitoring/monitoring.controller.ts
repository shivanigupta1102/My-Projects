import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { MonitorService } from './monitor.service';

@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MonitoringController {
  constructor(private readonly monitors: MonitorService) {}

  @Get('monitors')
  @ApiOperation({ summary: 'List monitors' })
  async list(@CurrentUser() user: RequestUser) {
    const data = await this.monitors.listMonitors(user.organizationId);
    return { success: true, data };
  }

  @Get('monitors/:id/health')
  @ApiOperation({ summary: 'Get monitor health' })
  async health(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.monitors.health(user.organizationId, id);
    return { success: true, data };
  }

  @Get('remediations')
  @ApiOperation({ summary: 'List remediation recommendations' })
  async remediations(@CurrentUser() user: RequestUser) {
    const data = await this.monitors.listRemediations(user.organizationId);
    return { success: true, data };
  }

  @Post('remediations/:id/apply')
  @ApiOperation({ summary: 'Apply remediation' })
  async apply(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.monitors.applyRemediation(user.organizationId, id);
    return { success: true, data };
  }

  @Post('remediations/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss remediation' })
  async dismiss(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.monitors.dismissRemediation(user.organizationId, id);
    return { success: true, data };
  }
}
