import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
jest.mock('../src/auth/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class FirebaseAuthGuard {},
  authenticatedUser: jest.fn(),
}));
import { PublicContentController } from '../src/public-content/public-content.controller';
import { PublicContentService } from '../src/public-content/public-content.service';
import type {
  PublicContentQueryDto,
  PublicFeedQueryDto,
} from '../src/public-content/public-content.dto';

describe('Public content query validation (e2e)', () => {
  let app: INestApplication;
  const content = {
    listFeed: jest.fn((query: PublicFeedQueryDto) => ({
      data: [],
      pagination: { ...query, total: 0, hasNextPage: false },
    })),
    listMapMarkers: jest.fn((query: PublicContentQueryDto) => ({
      data: [],
      hasMore: false,
      filters: query,
    })),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PublicContentController],
      providers: [{ provide: PublicContentService, useValue: content }],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => app.close());

  it('accepts declared feed and map filters while rejecting unknown query keys', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/feed?page=1&limit=20&city=%C4%B0zmir')
      .expect(200, {
        data: [],
        pagination: { page: 1, limit: 20, city: 'İzmir', total: 0, hasNextPage: false },
      });
    expect(content.listFeed).toHaveBeenCalledWith({ page: 1, limit: 20, city: 'İzmir' });

    await request(app.getHttpServer())
      .get('/api/v1/public/map?city=İzmir')
      .expect(200, { data: [], hasMore: false, filters: { city: 'İzmir' } });

    await request(app.getHttpServer()).get('/api/v1/public/feed?unexpected=true').expect(400);
  });
});
