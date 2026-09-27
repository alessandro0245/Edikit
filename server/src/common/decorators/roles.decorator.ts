import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (Role | 'ADMIN' | 'USER')[]) =>
  SetMetadata(ROLES_KEY, roles);
