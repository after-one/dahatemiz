import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
import { AppModule } from '../src/app.module';
import { FirebaseAuthService } from '../src/auth/firebase-auth.service';
import { DatabaseService } from '../src/database/database.service';
import { StorageService } from '../src/media/storage.service';

describe('Application module wiring (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(FirebaseAuthService)
      .useValue({ verifyIdToken: jest.fn() })
      .overrideProvider(DatabaseService)
      .useValue({ upsertUser: jest.fn() })
      .overrideProvider(StorageService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('boots every feature module and serves the health endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(response.body.status).toBe('ok');
  });
});
