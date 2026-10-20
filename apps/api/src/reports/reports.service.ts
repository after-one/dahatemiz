import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IncidentCategory } from '@dahamiz/shared-types';
import { ReportStatus } from '@dahamiz/shared-types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import type { CreateReportDto } from './report.dto';
import { MediaService } from '../media/media.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(MediaService) private readonly media: MediaService,
  ) {}

  async create(user: AuthenticatedUser, input: CreateReportDto, requestId?: string) {
    if (!input.privacyConsentGiven)
      throw new BadRequestException('Explicit privacy consent is required.');
    await this.media.assertUploadsReady(user, input.mediaUploadIds, requestId);
    const created = await this.database.transaction(async (client) => {
      const reportResult = await client.query<{
        id: string;
        category: IncidentCategory;
        status: ReportStatus;
        description: string | null;
        district: string | null;
        city: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO reports (reporter_id, category, description, precise_location, district, city, privacy_consent_given)
         SELECT id, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, TRUE
         FROM users WHERE firebase_uid = $1 AND deleted_at IS NULL
         RETURNING id, category, status, description, district, city, created_at, updated_at`,
        [
          user.uid,
          input.category,
          input.description ?? null,
          input.longitude,
          input.latitude,
          input.district ?? null,
          input.city ?? 'Bilinmiyor',
        ],
      );
      const report = reportResult.rows[0];
      if (!report) throw new NotFoundException('User profile not found.');
      if (input.mediaUploadIds.length) {
        const media = await client.query(
          `UPDATE media_upload_intents SET used_at = NOW()
           WHERE upload_id = ANY($1::uuid[]) AND owner_id = (SELECT id FROM users WHERE firebase_uid = $2)
             AND used_at IS NULL AND expires_at > NOW()
           RETURNING upload_id`,
          [input.mediaUploadIds, user.uid],
        );
        if (media.rowCount !== input.mediaUploadIds.length)
          throw new BadRequestException('One or more media uploads are invalid or expired.');
        await client.query(
          `INSERT INTO report_media (report_id, upload_id) SELECT $1, unnest($2::uuid[])`,
          [report.id, input.mediaUploadIds],
        );
      }
      await client.query(
        `INSERT INTO report_status_events (report_id, status) VALUES ($1, 'SUBMITTED')`,
        [report.id],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id)
         SELECT id, 'REPORT_CREATED', 'REPORT', $2, $3 FROM users WHERE firebase_uid = $1`,
        [user.uid, report.id, requestId ?? null],
      );
      return report;
    });
    return this.toView(created, [
      { status: ReportStatus.SUBMITTED, timestamp: created.created_at.toISOString() },
    ]);
  }

  async listMine(user: AuthenticatedUser) {
    const result = await this.database.query<ReportRow>(
      `SELECT r.id, r.category, r.status, r.description, r.district, r.city, r.created_at, r.updated_at
       FROM reports r JOIN users u ON u.id = r.reporter_id
       WHERE u.firebase_uid = $1 AND u.deleted_at IS NULL ORDER BY r.created_at DESC LIMIT 100`,
      [user.uid],
    );
    if (!result.rows.length) return { data: [] };
    const events = await this.database.query<ReportEventRow>(
      `SELECT e.report_id, e.status, e.public_message, e.created_at
       FROM report_status_events e
       JOIN reports r ON r.id = e.report_id JOIN users u ON u.id = r.reporter_id
       WHERE r.id = ANY($1::uuid[]) AND u.firebase_uid = $2
       ORDER BY e.created_at`,
      [result.rows.map((row) => row.id), user.uid],
    );
    const eventsByReport = new Map<string, ReportEventRow[]>();
    for (const event of events.rows) {
      const reportEvents = eventsByReport.get(event.report_id) ?? [];
      reportEvents.push(event);
      eventsByReport.set(event.report_id, reportEvents);
    }
    return {
      data: result.rows.map((row) =>
        this.toView(row, this.toStatusHistory(eventsByReport.get(row.id) ?? [])),
      ),
    };
  }

  async getMine(user: AuthenticatedUser, reportId: string) {
    const result = await this.database.query<ReportRow>(
      `SELECT r.id, r.category, r.status, r.description, r.district, r.city, r.created_at, r.updated_at
       FROM reports r JOIN users u ON u.id = r.reporter_id
       WHERE r.id = $1 AND u.firebase_uid = $2 AND u.deleted_at IS NULL`,
      [reportId, user.uid],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Report not found.');
    return this.getView(user, row);
  }

  async withdraw(user: AuthenticatedUser, reportId: string, requestId?: string) {
    const row = await this.database.transaction(async (client) => {
      const result = await client.query<ReportRow>(
        `UPDATE reports r SET status = 'WITHDRAWN', withdrawn_at = NOW(), updated_at = NOW()
         FROM users u WHERE r.reporter_id = u.id AND r.id = $1 AND u.firebase_uid = $2
           AND r.status IN ('SUBMITTED', 'UNDER_REVIEW')
         RETURNING r.id, r.category, r.status, r.description, r.district, r.city, r.created_at, r.updated_at`,
        [reportId, user.uid],
      );
      const updated = result.rows[0];
      if (!updated) return undefined;
      await client.query(
        `INSERT INTO report_status_events (report_id, status) VALUES ($1, 'WITHDRAWN')`,
        [reportId],
      );
      await client.query(
        'UPDATE public_posts SET published_at = NULL WHERE source_report_id = $1',
        [reportId],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, request_id) SELECT id, 'REPORT_WITHDRAWN', 'REPORT', $2, $3 FROM users WHERE firebase_uid = $1`,
        [user.uid, reportId, requestId ?? null],
      );
      return updated;
    });
    if (!row) {
      const exists = await this.database.query(
        'SELECT 1 FROM reports r JOIN users u ON u.id = r.reporter_id WHERE r.id = $1 AND u.firebase_uid = $2',
        [reportId, user.uid],
      );
      if (!exists.rowCount) throw new NotFoundException('Report not found.');
      throw new ForbiddenException('This report can no longer be withdrawn.');
    }
    return this.getView(user, row);
  }

  private async getView(user: AuthenticatedUser, row: ReportRow) {
    const events = await this.database.query<Omit<ReportEventRow, 'report_id'>>(
      `SELECT e.status, e.public_message, e.created_at FROM report_status_events e
       JOIN reports r ON r.id = e.report_id JOIN users u ON u.id = r.reporter_id
       WHERE r.id = $1 AND u.firebase_uid = $2 ORDER BY e.created_at`,
      [row.id, user.uid],
    );
    return this.toView(row, this.toStatusHistory(events.rows));
  }

  private toStatusHistory(events: readonly Omit<ReportEventRow, 'report_id'>[]) {
    return events.map((event) => ({
      status: event.status,
      timestamp: event.created_at.toISOString(),
      ...(event.public_message ? { publicMessage: event.public_message } : {}),
    }));
  }

  private toView(
    row: ReportRow,
    statusHistory: readonly { status: ReportStatus; timestamp: string; publicMessage?: string }[],
  ) {
    return {
      id: row.id,
      category: row.category,
      status: row.status,
      description: row.description ?? undefined,
      location: { district: row.district ?? undefined, city: row.city, country: 'TR' },
      statusHistory,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      canWithdraw:
        row.status === ReportStatus.SUBMITTED || row.status === ReportStatus.UNDER_REVIEW,
    };
  }
}

interface ReportRow {
  id: string;
  category: IncidentCategory;
  status: ReportStatus;
  description: string | null;
  district: string | null;
  city: string;
  created_at: Date;
  updated_at: Date;
}

interface ReportEventRow {
  report_id: string;
  status: ReportStatus;
  public_message: string | null;
  created_at: Date;
}
