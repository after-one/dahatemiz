import type { UserRole } from '@dahamiz/shared-types';

export interface AuthenticatedUser {
  readonly uid: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly role: UserRole;
}

export const AUTHENTICATED_USER_KEY = 'authenticatedUser';
