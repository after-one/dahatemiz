import { IncidentCategory, ReportStatus, UserRole } from '@dahamiz/shared-types';
import { NotFoundException, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard';
import { FirebaseAuthService } from '../src/auth/firebase-auth.service';
import { DatabaseService } from '../src/database/database.service';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';

describe('Authenticated report API (e2e)', () => {
  let app: INestApplication;
  const reports = new Map<string, Record<string, unknown>>();
  const firebase = {
    verifyIdToken: jest.fn(async (token: string) => ({
      uid: token === 'token-alice' ? 'alice' : 'bob',
    })),
  };
  const database = {
    upsertUser: jest.fn(async ({ uid }: { uid: string }) => ({ uid, role: UserRole.CITIZEN })),
  };
  const service = {
    create: jest.fn(async (user, input) => {
      if (!input.privacyConsentGiven) throw new Error('consent required');
      const report = {
        id: '00000000-0000-4000-8000-000000000001',
        category: input.category,
        status: ReportStatus.SUBMITTED,
        location: { city: input.city ?? 'Bilinmiyor', country: 'TR' },
        statusHistory: [{ status: ReportStatus.SUBMITTED, timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canWithdraw: true,
      };
      reports.set(`${user.uid}:${report.id}`, report);
      return report;
    }),
    listMine: jest.fn(async (user) => ({
      data: [...reports.entries()]
        .filter(([key]) => key.startsWith(`${user.uid}:`))
        .map(([, report]) => report),
    })),
    getMine: jest.fn(async (user, id) => {
      const report = reports.get(`${user.uid}:${id}`);
      if (!report) throw new NotFoundException('Report not found.');
      return report;
    }),
    withdraw: jest.fn(async (user, id) => {
      const report = reports.get(`${user.uid}:${id}`);
      if (!report) throw new NotFoundException('Report not found.');
      const withdrawn = { ...report, status: ReportStatus.WITHDRAWN, canWithdraw: false };
      reports.set(`${user.uid}:${id}`, withdrawn);
      return withdrawn;
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        FirebaseAuthGuard,
        { provide: FirebaseAuthService, useValue: firebase },
        { provide: DatabaseService, useValue: database },
        { provide: ReportsService, useValue: service },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    reports.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => app.close());

  it('rejects requests without a Firebase bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/reports').expect(401);
    expect(firebase.verifyIdToken).not.toHaveBeenCalled();
  });

  it('validates input, creates a private report, scopes history to its owner, and permits withdrawal', async () => {
    const payload = {
      category: IncidentCategory.LITTERING,
      latitude: 41.0082,
      longitude: 28.9784,
      city: 'İstanbul',
      mediaUploadIds: [],
      privacyConsentGiven: true,
    };
    await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer token-alice')
      .send({ ...payload, extra: 'rejected' })
      .expect(400);

    const created = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer token-alice')
      .send(payload);
    if (created.status !== 201) throw new Error(JSON.stringify(created.body));
    expect(created.body).toMatchObject({
      status: ReportStatus.SUBMITTED,
      canWithdraw: true,
      location: { city: 'İstanbul' },
    });
    expect(created.body).not.toHaveProperty('preciseCoordinates');
    expect(created.body).not.toHaveProperty('evidenceUrl');

    await request(app.getHttpServer())
      .get('/api/v1/reports')
      .set('Authorization', 'Bearer token-bob')
      .expect(200, { data: [] });
    await request(app.getHttpServer())
      .get('/api/v1/reports/00000000-0000-4000-8000-000000000001')
      .set('Authorization', 'Bearer token-bob')
      .expect(404);

    const withdrawn = await request(app.getHttpServer())
      .post('/api/v1/reports/00000000-0000-4000-8000-000000000001/withdraw')
      .set('Authorization', 'Bearer token-alice')
      .expect(201);
    expect(withdrawn.body).toMatchObject({ status: ReportStatus.WITHDRAWN, canWithdraw: false });
  });
});
