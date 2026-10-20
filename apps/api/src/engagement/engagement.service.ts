import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Achievement,
  CommunityEventSummary,
  CommunityTeamSummary,
  EngagementPreferences,
  EngagementSummary,
  InAppNotification,
  LeaderboardEntry,
  TeamLeaderboardEntry,
  XpEvent,
} from '@dahamiz/shared-types';
import { XpReason } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import type {
  CreateCommunityEventDto,
  CreateCommunityTeamDto,
  EngagementPreferencesDto,
  LeaderboardQueryDto,
} from './engagement.dto';

const VERIFIED_ATTENDANCE_POINTS = 20;

@Injectable()
export class EngagementService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listEvents(user: AuthenticatedUser): Promise<{ data: CommunityEventSummary[] }> {
    const result = await this.database.query<{
      id: string;
      title: string;
      description: string;
      city: string;
      district: string | null;
      starts_at: Date;
      participant_count: number;
      joined: boolean;
    }>(
      `SELECT e.id, e.title, e.description, e.city, e.district, e.starts_at,
              count(p.id) FILTER (WHERE p.status IN ('RSVP', 'CHECKED_IN'))::int AS participant_count,
              COALESCE(bool_or(p.user_id = u.id AND p.status IN ('RSVP', 'CHECKED_IN')), FALSE) AS joined
       FROM community_events e
       JOIN users u ON u.firebase_uid = $1 AND u.deleted_at IS NULL
       LEFT JOIN community_event_participants p ON p.event_id = e.id
       WHERE e.status = 'SCHEDULED' AND e.starts_at > NOW() - INTERVAL '1 day'
       GROUP BY e.id ORDER BY e.starts_at ASC LIMIT 100`,
      [user.uid],
    );
    return {
      data: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        city: row.city,
        ...(row.district ? { district: row.district } : {}),
        startsAt: row.starts_at.toISOString(),
        participantCount: row.participant_count,
        joined: row.joined,
      })),
    };
  }

  async joinEvent(user: AuthenticatedUser, eventId: string, requestId?: string) {
    try {
      return await this.database.transaction(async (client) => {
        const result = await client.query<{ id: string }>(
          `INSERT INTO community_event_participants (event_id, user_id)
           SELECT e.id, u.id FROM community_events e CROSS JOIN users u
           WHERE e.id = $1 AND e.status = 'SCHEDULED' AND e.starts_at > NOW()
             AND u.firebase_uid = $2 AND u.deleted_at IS NULL
           ON CONFLICT (event_id, user_id) DO UPDATE
             SET status = 'RSVP', updated_at = NOW()
             WHERE community_event_participants.status = 'CANCELLED'
           RETURNING id`,
          [eventId, user.uid],
        );
        const participant = result.rows[0];
        if (!participant) {
          const event = await client.query('SELECT 1 FROM community_events WHERE id = $1', [
            eventId,
          ]);
          if (!event.rowCount) throw new NotFoundException('Community event not found.');
          throw new ConflictException('This event is no longer open for registration.');
        }
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
           SELECT id, 'COMMUNITY_EVENT_RSVP', 'COMMUNITY_EVENT', $2, $3
           FROM users WHERE firebase_uid = $1`,
          [user.uid, eventId, requestId ?? null],
        );
        return { participantId: participant.id, status: 'RSVP' as const };
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('You already joined this event.');
      throw error;
    }
  }

  async cancelRsvp(user: AuthenticatedUser, eventId: string) {
    const result = await this.database.query(
      `UPDATE community_event_participants p SET status = 'CANCELLED', updated_at = NOW()
       FROM community_events e, users u
       WHERE p.event_id = e.id AND p.user_id = u.id AND e.id = $1 AND u.firebase_uid = $2
         AND p.status = 'RSVP' AND e.starts_at > NOW()
       RETURNING p.id`,
      [eventId, user.uid],
    );
    if (!result.rowCount)
      throw new ConflictException('This registration can no longer be cancelled.');
    return { eventId, status: 'CANCELLED' as const };
  }

  async createEvent(user: AuthenticatedUser, input: CreateCommunityEventDto) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{ id: string; starts_at: Date }>(
        `INSERT INTO community_events (title, description, city, district, starts_at, created_by)
         SELECT $2, $3, $4, $5, $6, u.id FROM users u
         WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL AND u.role IN ('MODERATOR', 'ADMIN')
         RETURNING id, starts_at`,
        [
          user.uid,
          input.title.trim(),
          input.description.trim(),
          input.city.trim(),
          input.district?.trim() || null,
          input.startsAt,
        ],
      );
      const event = result.rows[0];
      if (!event) throw new NotFoundException('Event could not be created.');
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'COMMUNITY_EVENT_CREATED', 'COMMUNITY_EVENT', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, event.id],
      );
      return {
        id: event.id,
        startsAt: event.starts_at.toISOString(),
        status: 'SCHEDULED' as const,
      };
    });
  }

  async listParticipants(eventId: string) {
    const result = await this.database.query<{
      id: string;
      display_name: string | null;
      status: string;
    }>(
      `SELECT p.id, u.display_name, p.status
       FROM community_event_participants p JOIN users u ON u.id = p.user_id
       WHERE p.event_id = $1 AND p.status <> 'CANCELLED'
       ORDER BY p.created_at ASC LIMIT 500`,
      [eventId],
    );
    if (!result.rowCount) {
      const event = await this.database.query('SELECT 1 FROM community_events WHERE id = $1', [
        eventId,
      ]);
      if (!event.rowCount) throw new NotFoundException('Community event not found.');
    }
    return {
      data: result.rows.map((row) => ({
        participantId: row.id,
        displayName: row.display_name ?? 'Katılımcı',
        status: row.status,
      })),
    };
  }

  async verifyAttendance(
    user: AuthenticatedUser,
    eventId: string,
    participantId: string,
    requestId?: string,
  ) {
    return this.database.transaction(async (client) => {
      const verified = await client.query<{ user_id: string; event_title: string }>(
        `UPDATE community_event_participants p SET status = 'CHECKED_IN', checked_in_by = m.id,
             checked_in_at = NOW(), updated_at = NOW()
         FROM community_events e, users m
         WHERE p.id = $1 AND p.event_id = e.id AND e.id = $2 AND e.status <> 'CANCELLED'
           AND e.starts_at <= NOW() AND p.status = 'RSVP'
           AND m.firebase_uid = $3 AND m.role IN ('MODERATOR', 'ADMIN') AND m.deleted_at IS NULL
         RETURNING p.user_id, e.title AS event_title`,
        [participantId, eventId, user.uid],
      );
      const row = verified.rows[0];
      if (!row) {
        const exists = await client.query(
          'SELECT 1 FROM community_event_participants WHERE id = $1 AND event_id = $2',
          [participantId, eventId],
        );
        if (!exists.rowCount) throw new NotFoundException('Event participant not found.');
        throw new ConflictException('Attendance is already verified or the event has not started.');
      }
      const xp = await client.query(
        `INSERT INTO xp_events (user_id, reason, points, source_type, source_id)
         VALUES ($1, $2, $3, 'COMMUNITY_EVENT', $4)`,
        [row.user_id, XpReason.VERIFIED_COMMUNITY_ATTENDANCE, VERIFIED_ATTENDANCE_POINTS, eventId],
      );
      if (xp.rowCount !== 1) throw new ConflictException('XP was already awarded for this event.');
      await client.query(
        `INSERT INTO in_app_notifications (user_id, type, event_id)
         SELECT $1, 'COMMUNITY_ATTENDANCE_VERIFIED', $2
         WHERE COALESCE((SELECT in_app_notifications_enabled FROM engagement_preferences WHERE user_id = $1), TRUE)
         ON CONFLICT (user_id, type, event_id) DO NOTHING`,
        [row.user_id, eventId],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
         SELECT id, 'COMMUNITY_ATTENDANCE_VERIFIED', 'COMMUNITY_EVENT_PARTICIPANT', $2, $3
         FROM users WHERE firebase_uid = $1`,
        [user.uid, participantId, requestId ?? null],
      );
      return {
        participantId,
        status: 'CHECKED_IN' as const,
        xpAwarded: VERIFIED_ATTENDANCE_POINTS,
      };
    });
  }

  async getSummary(user: AuthenticatedUser): Promise<EngagementSummary> {
    const result = await this.database.query<{
      total_xp: number;
      verified_event_count: number;
      verified_at: Date[] | null;
    }>(
      `SELECT COALESCE(SUM(x.points), 0)::int AS total_xp,
              COUNT(DISTINCT x.source_id)::int AS verified_event_count,
              array_agg(x.created_at ORDER BY x.created_at) FILTER (WHERE x.id IS NOT NULL) AS verified_at
       FROM xp_events x JOIN users u ON u.id = x.user_id
       WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL`,
      [user.uid],
    );
    const row = result.rows[0] ?? { total_xp: 0, verified_event_count: 0, verified_at: null };
    const recent = await this.database.query<{
      reason: XpReason;
      points: number;
      created_at: Date;
    }>(
      `SELECT x.reason, x.points, x.created_at FROM xp_events x JOIN users u ON u.id = x.user_id
       WHERE u.firebase_uid = $1 ORDER BY x.created_at DESC LIMIT 20`,
      [user.uid],
    );
    return {
      totalXp: row.total_xp,
      level: levelForXp(row.total_xp),
      verifiedEventCount: row.verified_event_count,
      achievements: achievementsFor(row.verified_event_count, row.verified_at ?? []),
      recentXpEvents: recent.rows.map((event): XpEvent => ({
        reason: event.reason,
        points: event.points,
        timestamp: event.created_at.toISOString(),
      })),
    };
  }

  async getPreferences(user: AuthenticatedUser): Promise<EngagementPreferences> {
    const result = await this.database.query<{
      in_app_notifications_enabled: boolean;
      push_notifications_enabled: boolean;
      leaderboard_opt_in: boolean;
    }>(
      `SELECT COALESCE(p.in_app_notifications_enabled, TRUE) AS in_app_notifications_enabled,
              COALESCE(p.push_notifications_enabled, FALSE) AS push_notifications_enabled,
              u.leaderboard_opt_in
       FROM users u LEFT JOIN engagement_preferences p ON p.user_id = u.id
       WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL`,
      [user.uid],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('User profile not found.');
    return {
      inAppNotificationsEnabled: row.in_app_notifications_enabled,
      pushNotificationsEnabled: row.push_notifications_enabled,
      leaderboardOptIn: row.leaderboard_opt_in,
    };
  }

  async updatePreferences(
    user: AuthenticatedUser,
    input: EngagementPreferencesDto,
    requestId?: string,
  ) {
    await this.database.transaction(async (client) => {
      await client.query(
        `INSERT INTO engagement_preferences (user_id, in_app_notifications_enabled, push_notifications_enabled)
         SELECT id, $2, $3 FROM users WHERE firebase_uid = $1 AND deleted_at IS NULL
         ON CONFLICT (user_id) DO UPDATE SET
           in_app_notifications_enabled = EXCLUDED.in_app_notifications_enabled,
           push_notifications_enabled = EXCLUDED.push_notifications_enabled, updated_at = NOW()`,
        [user.uid, input.inAppNotificationsEnabled, input.pushNotificationsEnabled],
      );
      await client.query(
        `UPDATE users SET leaderboard_opt_in = $2, updated_at = NOW()
         WHERE firebase_uid = $1 AND deleted_at IS NULL`,
        [user.uid, input.leaderboardOptIn],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
         SELECT id, 'ENGAGEMENT_PREFERENCES_UPDATED', 'USER', id::text, $2
         FROM users WHERE firebase_uid = $1`,
        [user.uid, requestId ?? null],
      );
    });
    return this.getPreferences(user);
  }

  async listNotifications(user: AuthenticatedUser): Promise<{ data: InAppNotification[] }> {
    const result = await this.database.query<{
      id: string;
      type: InAppNotification['type'];
      event_title: string;
      created_at: Date;
      read_at: Date | null;
    }>(
      `SELECT n.id, n.type, e.title AS event_title, n.created_at, n.read_at
       FROM in_app_notifications n JOIN community_events e ON e.id = n.event_id
       JOIN users u ON u.id = n.user_id
       WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL
       ORDER BY n.created_at DESC LIMIT 100`,
      [user.uid],
    );
    return {
      data: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        eventTitle: row.event_title,
        createdAt: row.created_at.toISOString(),
        ...(row.read_at ? { readAt: row.read_at.toISOString() } : {}),
      })),
    };
  }

  async markNotificationRead(user: AuthenticatedUser, notificationId: string) {
    const result = await this.database.query(
      `UPDATE in_app_notifications n SET read_at = COALESCE(read_at, NOW())
       FROM users u WHERE n.id = $1 AND n.user_id = u.id AND u.firebase_uid = $2 AND u.deleted_at IS NULL
       RETURNING n.id, n.read_at`,
      [notificationId, user.uid],
    );
    if (!result.rowCount) throw new NotFoundException('Notification not found.');
    return { id: notificationId, read: true };
  }

  async leaderboard(query: LeaderboardQueryDto): Promise<{ data: LeaderboardEntry[] }> {
    const result = await this.database.query<{
      rank: number;
      display_name: string | null;
      total_xp: number;
    }>(
      `SELECT ROW_NUMBER() OVER (ORDER BY SUM(x.points) DESC, u.created_at ASC)::int AS rank,
              u.display_name, SUM(x.points)::int AS total_xp
       FROM xp_events x JOIN users u ON u.id = x.user_id
       JOIN community_events e ON e.id = x.source_id
       WHERE u.leaderboard_opt_in = TRUE AND u.deleted_at IS NULL AND e.city ILIKE $1
         AND ($2::text IS NULL OR e.district ILIKE $2)
       GROUP BY u.id ORDER BY total_xp DESC, u.created_at ASC LIMIT 50`,
      [query.city.trim(), query.district?.trim() || null],
    );
    return {
      data: result.rows.map((row) => ({
        rank: row.rank,
        displayName: row.display_name ?? 'Komşu',
        totalXp: row.total_xp,
      })),
    };
  }

  async listTeams(
    user: AuthenticatedUser,
    query: LeaderboardQueryDto,
  ): Promise<{ data: CommunityTeamSummary[] }> {
    const result = await this.database.query<{
      id: string;
      name: string;
      description: string;
      city: string;
      district: string | null;
      member_count: number;
      joined: boolean;
    }>(
      `SELECT t.id, t.name, t.description, t.city, t.district,
              count(m.user_id)::int AS member_count,
              COALESCE(bool_or(m.user_id = u.id), FALSE) AS joined
       FROM community_teams t JOIN users u ON u.firebase_uid = $1 AND u.deleted_at IS NULL
       LEFT JOIN community_team_memberships m ON m.team_id = t.id
       WHERE t.city ILIKE $2 AND ($3::text IS NULL OR t.district ILIKE $3)
       GROUP BY t.id ORDER BY member_count DESC, t.name ASC LIMIT 100`,
      [user.uid, query.city.trim(), query.district?.trim() || null],
    );
    return {
      data: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        city: row.city,
        ...(row.district ? { district: row.district } : {}),
        memberCount: row.member_count,
        joined: row.joined,
      })),
    };
  }

  async createTeam(user: AuthenticatedUser, input: CreateCommunityTeamDto) {
    return this.database.transaction(async (client) => {
      const result = await client.query<{ id: string }>(
        `INSERT INTO community_teams (name, description, city, district, created_by)
         SELECT $2, $3, $4, $5, u.id FROM users u
         WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL AND u.role IN ('MODERATOR', 'ADMIN')
         RETURNING id`,
        [
          user.uid,
          input.name.trim(),
          input.description.trim(),
          input.city.trim(),
          input.district?.trim() || null,
        ],
      );
      const team = result.rows[0];
      if (!team) throw new NotFoundException('Team could not be created.');
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
         SELECT id, 'COMMUNITY_TEAM_CREATED', 'COMMUNITY_TEAM', $2 FROM users WHERE firebase_uid = $1`,
        [user.uid, team.id],
      );
      return { id: team.id, status: 'ACTIVE' as const };
    });
  }

  async joinTeam(user: AuthenticatedUser, teamId: string) {
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO community_team_memberships (team_id, user_id)
       SELECT t.id, u.id FROM community_teams t CROSS JOIN users u
       WHERE t.id = $1 AND u.firebase_uid = $2 AND u.deleted_at IS NULL
       ON CONFLICT (team_id, user_id) DO NOTHING RETURNING id`,
      [teamId, user.uid],
    );
    if (!result.rows[0]) {
      const existing = await this.database.query(
        `SELECT 1 FROM community_team_memberships m JOIN users u ON u.id = m.user_id
         WHERE m.team_id = $1 AND u.firebase_uid = $2 AND u.deleted_at IS NULL`,
        [teamId, user.uid],
      );
      if (!existing.rowCount) {
        const team = await this.database.query('SELECT 1 FROM community_teams WHERE id = $1', [
          teamId,
        ]);
        if (!team.rowCount) throw new NotFoundException('Community team not found.');
        throw new NotFoundException('User profile not found.');
      }
    }
    return { teamId, joined: true };
  }

  async leaveTeam(user: AuthenticatedUser, teamId: string) {
    const result = await this.database.query(
      `DELETE FROM community_team_memberships m USING users u
       WHERE m.team_id = $1 AND m.user_id = u.id AND u.firebase_uid = $2 AND u.deleted_at IS NULL
       RETURNING m.id`,
      [teamId, user.uid],
    );
    if (!result.rowCount) throw new ConflictException('You are not a member of this team.');
    return { teamId, joined: false };
  }

  async teamLeaderboard(query: LeaderboardQueryDto): Promise<{ data: TeamLeaderboardEntry[] }> {
    const result = await this.database.query<{
      rank: number;
      name: string;
      member_count: number;
      total_xp: number;
    }>(
      `WITH team_scores AS (
         SELECT t.id, t.name, count(DISTINCT m.user_id)::int AS member_count,
                COALESCE(sum(x.points), 0)::int AS total_xp
         FROM community_teams t
         LEFT JOIN community_team_memberships m ON m.team_id = t.id
         LEFT JOIN xp_events x ON x.user_id = m.user_id
         WHERE t.city ILIKE $1 AND ($2::text IS NULL OR t.district ILIKE $2)
         GROUP BY t.id
       )
       SELECT row_number() OVER (ORDER BY total_xp DESC, member_count DESC, name ASC)::int AS rank,
              name, member_count, total_xp
       FROM team_scores ORDER BY rank ASC LIMIT 50`,
      [query.city.trim(), query.district?.trim() || null],
    );
    return {
      data: result.rows.map((row) => ({
        rank: row.rank,
        teamName: row.name,
        memberCount: row.member_count,
        totalXp: row.total_xp,
      })),
    };
  }
}

function levelForXp(totalXp: number): number {
  if (totalXp >= 1500) return 5;
  if (totalXp >= 700) return 4;
  if (totalXp >= 300) return 3;
  if (totalXp >= 100) return 2;
  return 1;
}

function achievementsFor(count: number, verifiedAt: readonly Date[]): Achievement[] {
  const milestones = [
    {
      count: 1,
      key: 'firstVerifiedEvent',
      titleTr: 'İlk ortak etkinlik',
      descriptionTr: 'Doğrulanmış ilk topluluk etkinliğine katıldın.',
    },
    {
      count: 5,
      key: 'fiveVerifiedEvents',
      titleTr: 'Mahalle gönüllüsü',
      descriptionTr: 'Beş topluluk etkinliğine doğrulanmış katılım sağladın.',
    },
    {
      count: 10,
      key: 'tenVerifiedEvents',
      titleTr: 'Doğa dostu',
      descriptionTr: 'On topluluk etkinliğine doğrulanmış katılım sağladın.',
    },
  ];
  return milestones
    .filter((item) => count >= item.count)
    .map((item) => {
      const earnedAt = verifiedAt[item.count - 1];
      return {
        id: item.key,
        key: item.key,
        titleTr: item.titleTr,
        descriptionTr: item.descriptionTr,
        ...(earnedAt ? { earnedAt: earnedAt.toISOString() } : {}),
      };
    });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
