import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current organization' })
  async me(@CurrentUser() user: RequestUser) {
    const data = await this.organizations.getMe(user.organizationId);
    return { success: true, data };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current organization' })
  async patchMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const data = await this.organizations.updateMe(user.organizationId, dto);
    return { success: true, data };
  }
}
