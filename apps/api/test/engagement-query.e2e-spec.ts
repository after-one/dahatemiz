import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
jest.mock('../src/auth/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class FirebaseAuthGuard {},
  authenticatedUser: jest.fn(),
}));
jest.mock('../src/auth/roles.guard', () => ({ RolesGuard: class RolesGuard {} }));
import { EngagementController } from '../src/engagement/engagement.controller';
import { EngagementService } from '../src/engagement/engagement.service';
import type { LeaderboardQueryDto } from '../src/engagement/engagement.dto';

describe('Engagement query validation (e2e)', () => {
  let app: INestApplication;
  const engagement = {
    leaderboard: jest.fn((query: LeaderboardQueryDto) => ({ data: [], query })),
    teamLeaderboard: jest.fn((query: LeaderboardQueryDto) => ({ data: [], query })),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [EngagementController],
      providers: [{ provide: EngagementService, useValue: engagement }],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => app.close());

  it('accepts the declared city and district query fields', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/engagement/leaderboard?city=%C4%B0zmir&district=Konak')
      .expect(200, { data: [], query: { city: 'İzmir', district: 'Konak' } });
    await request(app.getHttpServer())
      .get('/api/v1/engagement/teams/leaderboard?city=Ankara')
      .expect(200, { data: [], query: { city: 'Ankara' } });
    await request(app.getHttpServer()).get('/api/v1/engagement/leaderboard?other=1').expect(400);
  });
});
