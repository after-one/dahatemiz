import { ConflictException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { UserRole, XpReason } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { DatabaseService } from '../database/database.service';
import { EngagementService } from './engagement.service';

const moderator: AuthenticatedUser = { uid: 'moderator-uid', role: UserRole.MODERATOR };

describe('EngagementService', () => {
  it('awards server-defined XP only after verified attendance and records its audit event', async () => {
    const client = { query: jest.fn() };
    client.query
      .mockResolvedValueOnce({
        rows: [{ user_id: 'user-1', event_title: 'Park temizliği' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const database = {
      transaction: jest.fn((operation: (connection: PoolClient) => Promise<unknown>) =>
        operation(client as unknown as PoolClient),
      ),
    } as unknown as DatabaseService;
    const service = new EngagementService(database);

    await expect(service.verifyAttendance(moderator, 'event-1', 'participant-1')).resolves.toEqual({
      participantId: 'participant-1',
      status: 'CHECKED_IN',
      xpAwarded: 20,
    });

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("m.role IN ('MODERATOR', 'ADMIN')"),
      ['participant-1', 'event-1', 'moderator-uid'],
    );
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO xp_events'),
      ['user-1', XpReason.VERIFIED_COMMUNITY_ATTENDANCE, 20, 'event-1'],
    );
    expect(client.query).toHaveBeenCalledTimes(4);
  });

  it('does not award XP twice for an already verified attendance', async () => {
    const client = { query: jest.fn() };
    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ exists: 1 }], rowCount: 1 });
    const database = {
      transaction: jest.fn((operation: (connection: PoolClient) => Promise<unknown>) =>
        operation(client as unknown as PoolClient),
      ),
    } as unknown as DatabaseService;
    const service = new EngagementService(database);

    await expect(
      service.verifyAttendance(moderator, 'event-1', 'participant-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(client.query).toHaveBeenCalledTimes(2);
    expect(
      client.query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO xp_events')),
    ).toBe(false);
  });

  it('calculates achievements from verified event history', async () => {
    const dates = Array.from(
      { length: 5 },
      (_, index) => new Date(`2026-10-0${index + 1}T12:00:00.000Z`),
    );
    const database = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ total_xp: 100, verified_event_count: 5, verified_at: dates }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    } as unknown as DatabaseService;
    const service = new EngagementService(database);

    const summary = await service.getSummary({ uid: 'user-1', role: UserRole.CITIZEN });
    expect(summary.totalXp).toBe(100);
    expect(summary.level).toBe(2);
    expect(summary.achievements.map(({ key, earnedAt }) => ({ key, earnedAt }))).toEqual([
      { key: 'firstVerifiedEvent', earnedAt: dates[0]?.toISOString() },
      { key: 'fiveVerifiedEvents', earnedAt: dates[4]?.toISOString() },
    ]);
  });
});
