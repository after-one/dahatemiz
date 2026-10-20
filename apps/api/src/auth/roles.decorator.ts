import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@dahamiz/shared-types';

export const REQUIRED_ROLES = 'required_roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES, roles);
