import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAuthService {
  private readonly app: App | undefined;

  constructor(@Inject(ConfigService) config: ConfigService) {
    if (
      config.get<string>('NODE_ENV') === 'production' &&
      config.get<string>('FIREBASE_AUTH_EMULATOR_HOST')
    ) {
      throw new Error('Firebase Auth Emulator cannot be enabled in production.');
    }
    const projectId = config.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) return;

    const privateKey = config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
    const credential =
      privateKey && clientEmail
        ? cert({ projectId, clientEmail, privateKey })
        : applicationDefault();
    this.app =
      getApps().find((candidate) => candidate.name === 'dahamiz-api') ??
      initializeApp({ credential, projectId }, 'dahamiz-api');
  }

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    if (!this.app) throw new ServiceUnavailableException('Authentication is not configured.');
    try {
      return await getAuth(this.app).verifyIdToken(token, true);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
