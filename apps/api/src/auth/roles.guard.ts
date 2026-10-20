import {
  ForbiddenException,
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@dahamiz/shared-types';
import type { Request } from 'express';
import { authenticatedUser } from './firebase-auth.guard';
import { REQUIRED_ROLES } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const user = authenticatedUser(context.switchToHttp().getRequest<Request>());
    if (roles.includes(user.role)) return true;
    throw new ForbiddenException('Your account cannot perform this action.');
  }
}
