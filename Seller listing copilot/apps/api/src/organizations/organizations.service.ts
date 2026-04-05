import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { PrismaService } from '@/config/database.config';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(organizationId: string): Promise<Organization> {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async updateMe(organizationId: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
    });
  }
}
