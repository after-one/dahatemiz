import { MediaType, UserRole } from '@dahamiz/shared-types';
import { ServiceUnavailableException, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard';
import { FirebaseAuthService } from '../src/auth/firebase-auth.service';
import { DatabaseService } from '../src/database/database.service';
import { MediaController } from '../src/media/media.controller';
import { MediaService } from '../src/media/media.service';
import { StorageService } from '../src/media/storage.service';

describe('Private media upload authorization (e2e)', () => {
  let app: INestApplication;
  const database = {
    upsertUser: jest.fn(async ({ uid }: { uid: string }) => ({ uid, role: UserRole.CITIZEN })),
  };
  const firebase = { verifyIdToken: jest.fn(async () => ({ uid: 'alice' })) };
  const storage = {
    assertConfigured: jest.fn(() => {
      throw new ServiceUnavailableException('Private evidence storage is not configured.');
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        FirebaseAuthGuard,
        MediaService,
        { provide: FirebaseAuthService, useValue: firebase },
        { provide: DatabaseService, useValue: database },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  it('requires authentication and refuses to mint a local fake upload URL without private storage', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/media/upload-authorizations')
      .send({
        mediaType: MediaType.IMAGE,
        fileSizeBytes: 1200,
        mimeType: 'image/jpeg',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/media/upload-authorizations')
      .set('Authorization', 'Bearer valid-token')
      .send({ mediaType: MediaType.IMAGE, fileSizeBytes: 1200, mimeType: 'application/pdf' })
      .expect(400);

    const response = await request(app.getHttpServer())
      .post('/api/v1/media/upload-authorizations')
      .set('Authorization', 'Bearer valid-token')
      .send({ mediaType: MediaType.IMAGE, fileSizeBytes: 1200, mimeType: 'image/jpeg' });
    if (response.status !== 503) throw new Error(JSON.stringify(response.body));
    expect(response.body).not.toHaveProperty('signedUrl');
    expect(database.upsertUser).toHaveBeenCalledTimes(2);
  });
});
