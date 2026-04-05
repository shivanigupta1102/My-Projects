import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    this.$use(this.auditLogImmutableMiddleware);
  }

  private readonly auditLogImmutableMiddleware: Prisma.Middleware = async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> => {
    if (params.model === 'AuditLog') {
      if (params.action === 'update' || params.action === 'delete') {
        throw new ServiceUnavailableException(
          'AuditLog records are append-only and cannot be updated or deleted',
        );
      }
    }
    return next(params);
  };

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
