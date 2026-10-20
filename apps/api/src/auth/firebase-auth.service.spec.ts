import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
import { FirebaseAuthService } from './firebase-auth.service';

describe('FirebaseAuthService', () => {
  it('fails closed when no Firebase project is configured', async () => {
    const service = new FirebaseAuthService(new ConfigService({ NODE_ENV: 'development' }));

    await expect(service.verifyIdToken('any-token')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('refuses to trust emulator tokens in production', () => {
    const originalNodeEnv = process.env['NODE_ENV'];
    const originalEmulatorHost = process.env['FIREBASE_AUTH_EMULATOR_HOST'];
    process.env['NODE_ENV'] = 'production';
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
    try {
      expect(() => new FirebaseAuthService(new ConfigService())).toThrow(
        'Firebase Auth Emulator cannot be enabled in production.',
      );
    } finally {
      if (originalNodeEnv === undefined) delete process.env['NODE_ENV'];
      else process.env['NODE_ENV'] = originalNodeEnv;
      if (originalEmulatorHost === undefined) delete process.env['FIREBASE_AUTH_EMULATOR_HOST'];
      else process.env['FIREBASE_AUTH_EMULATOR_HOST'] = originalEmulatorHost;
    }
  });
});
