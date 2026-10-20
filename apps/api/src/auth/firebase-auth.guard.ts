import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthService } from './firebase-auth.service';
import type { AuthenticatedUser } from './auth.types';
import { AUTHENTICATED_USER_KEY } from './auth.types';
import { DatabaseService } from '../database/database.service';

type AuthenticatedRequest = Request & { [AUTHENTICATED_USER_KEY]?: AuthenticatedUser };

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject(FirebaseAuthService) private readonly firebase: FirebaseAuthService,
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!token) throw new UnauthorizedException('A Firebase ID token is required.');
    const decoded = await this.firebase.verifyIdToken(token);
    const user = await this.database.upsertUser({
      uid: decoded.uid,
      ...(decoded.email ? { email: decoded.email } : {}),
      ...(typeof decoded.name === 'string' ? { displayName: decoded.name } : {}),
    });
    request[AUTHENTICATED_USER_KEY] = user;
    return true;
  }
}

export function authenticatedUser(request: Request): AuthenticatedUser {
  const user = (request as AuthenticatedRequest)[AUTHENTICATED_USER_KEY];
  if (!user) throw new UnauthorizedException();
  return user;
}
