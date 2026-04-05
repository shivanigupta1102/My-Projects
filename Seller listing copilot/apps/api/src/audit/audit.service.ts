import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PaginatedResponse } from '@listingpilot/shared-types';
import { PrismaService } from '@/config/database.config';

export interface AuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    organizationId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        detailsJson: params.details as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
      },
    });
  }

  async query(
    organizationId: string,
    q: AuditQuery,
  ): Promise<PaginatedResponse<AuditLog>> {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(q.action ? { action: q.action } : {}),
      ...(q.entityType ? { entityType: q.entityType } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
