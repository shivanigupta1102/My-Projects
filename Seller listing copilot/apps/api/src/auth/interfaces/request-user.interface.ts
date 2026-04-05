import { Role } from '@prisma/client';

export interface RequestUser {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
}
