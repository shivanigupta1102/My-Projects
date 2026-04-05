import {
  Body,
  Controller,
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
import { Channel, PackageStatus } from '@prisma/client';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import { ListingPackagesService } from './listing-packages.service';

@ApiTags('listing-packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('listing-packages')
export class ListingPackagesController {
  constructor(private readonly packages: ListingPackagesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate listing packages for channels in parallel' })
  async generate(
    @CurrentUser() user: RequestUser,
    @Body() body: { productId: string; channels: Channel[] },
  ) {
    const data = await this.packages.generatePackages(
      user.organizationId,
      body.productId,
      body.channels,
    );
    return { success: true, data };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'List packages for product' })
  async byProduct(
    @CurrentUser() user: RequestUser,
    @Param('productId') productId: string,
  ) {
    const data = await this.packages.byProduct(user.organizationId, productId);
    return { success: true, data };
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Run validation / quality score' })
  async validate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.packages.validate(user.organizationId, id);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing package' })
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.packages.getById(user.organizationId, id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update listing package draft fields' })
  async patch(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body()
    body: { title?: string; description?: string; status?: PackageStatus },
  ) {
    const data = await this.packages.updatePackage(user.organizationId, id, body);
    return { success: true, data };
  }
}
